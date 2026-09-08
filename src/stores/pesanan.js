import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { familyOf, orderFromDoc, summarizeRoots } from '@/lib/orders'
import { useAuthStore } from '@/stores/auth'

const startOfToday = () => {
  const now = new Date()
  return Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
}

/**
 * Parked orders, live from Firestore. A root order is `order-{n}`; anything
 * added to it later is a separate `extra-{m}-order-{n}` document that keeps
 * rootNumber pointing back. Extras are records, not destinations: the UI only
 * ever names the root, so browse the list through `rootSummaries`, never
 * `orders` directly.
 *
 * The listener covers today only. Nothing in the app closes a bill, so an
 * unbounded query would grow forever; the cost is that a table opened before
 * midnight drops off the list after it.
 */
export const usePesananStore = defineStore('pesanan', () => {
  const orders = ref([])

  /** False until the first snapshot lands — numbering is derived from it. */
  const loaded = ref(false)

  /** Set when Firestore rejects a write, which the cart can no longer undo. */
  const saveError = ref('')

  let unsubscribe = null

  const rootOrder = (rootNumber) =>
    orders.value.find((order) => order.rootNumber === rootNumber && !order.extraNumber)

  const orderFamily = (rootNumber) => familyOf(orders.value, rootNumber)

  /** The running bill as read-only rounds: each round keeps its own name,
   *  time and creator so the cart can show who fired what. */
  const referenceRounds = (rootNumber) =>
    orderFamily(rootNumber).map(({ id, name, lines, createdBy, createdAt }) => ({
      id,
      name,
      createdBy,
      createdAt,
      lines: lines.map((line) => ({ ...line })),
    }))

  const nextExtraNumber = (rootNumber) =>
    orders.value.filter((order) => order.rootNumber === rootNumber && order.extraNumber).length + 1

  /**
   * Highest number in view, plus one. Two tablets saving in the same instant —
   * or both working through a wifi outage — can land on the same number.
   */
  const nextRootNumber = () =>
    orders.value.reduce((highest, order) => Math.max(highest, order.rootNumber), 0) + 1

  /** One row per table for DAFTAR PESANAN — the listener holds the whole day,
   *  so every family is complete here. */
  const rootSummaries = computed(() => summarizeRoots(orders.value))

  /** Tables with a parked order — extras are folded into their root. */
  const count = computed(() => rootSummaries.value.length)

  /**
   * Firestore resolves this against the local cache first, so the new order
   * appears immediately and syncs in the background. Awaiting it would hang
   * for as long as the connection is down, so failures are reported instead.
   */
  function append(order) {
    const auth = useAuthStore()
    const record = {
      ...order,
      lines: order.lines.map((line) => ({ ...line })),
      createdBy: auth.name,
      createdByUid: auth.uid,
      createdAt: serverTimestamp(),
    }
    addDoc(collection(db, 'orders'), record).catch(() => {
      saveError.value = `Gagal menyimpan ${order.name}, orderan tidak tersimpan`
    })
  }

  function save({ table, people, lines }) {
    const rootNumber = nextRootNumber()
    append({
      name: `order-${rootNumber}`,
      rootNumber,
      extraNumber: null,
      table,
      people,
      lines,
    })
  }

  function saveExtra({ rootNumber, table, people, lines }) {
    const extraNumber = nextExtraNumber(rootNumber)
    append({
      name: `extra-${extraNumber}-order-${rootNumber}`,
      rootNumber,
      extraNumber,
      table,
      people,
      lines,
    })
  }

  /** Orders are readable only while signed in, so the listener follows the session. */
  function subscribe() {
    if (unsubscribe) return
    const today = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startOfToday()),
      orderBy('createdAt', 'desc'),
    )
    unsubscribe = onSnapshot(today, (snapshot) => {
      orders.value = snapshot.docs.map(orderFromDoc)
      loaded.value = true
    })
  }

  function unsubscribeAll() {
    unsubscribe?.()
    unsubscribe = null
    orders.value = []
    loaded.value = false
  }

  function clearSaveError() {
    saveError.value = ''
  }

  return {
    orders,
    loaded,
    saveError,
    rootSummaries,
    count,
    rootOrder,
    orderFamily,
    referenceRounds,
    save,
    saveExtra,
    subscribe,
    unsubscribe: unsubscribeAll,
    clearSaveError,
  }
})
