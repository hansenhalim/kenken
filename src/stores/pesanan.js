import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { familyOf, orderFromDoc, summarizeRoots } from '@/lib/orders'
import { useAuthStore } from '@/stores/auth'

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const pad = (value) => String(value).padStart(2, '0')

/** `2026-09-08` — the counter's day, compared as a string so it sorts by date. */
const dayKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Allocates root numbers. One document, reset in place each morning. */
const COUNTER = ['counters', 'orders']

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

  /** False until the first snapshot lands. */
  const loaded = ref(false)

  /**
   * Midnight the listener was anchored to. Firestore froze that bound into the
   * query when it was built, so a tablet left open past midnight keeps serving
   * the previous day — screens date themselves from this rather than the clock
   * so they say which day they are actually showing.
   */
  const since = ref(null)

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

  /** One row per table for DAFTAR PESANAN — the listener holds the whole day,
   *  so every family is complete here. */
  const rootSummaries = computed(() => summarizeRoots(orders.value))

  /** Tables with a parked order — extras are folded into their root. */
  const count = computed(() => rootSummaries.value.length)

  const recordFor = (order) => {
    const auth = useAuthStore()
    return {
      ...order,
      lines: order.lines.map((line) => ({ ...line })),
      createdBy: auth.name,
      createdByUid: auth.uid,
      createdAt: serverTimestamp(),
    }
  }

  /**
   * Numbers come from the server so two tablets can never land on the same one:
   * a duplicate root number would merge two tables into one bill, since
   * `familyOf` groups on it.
   *
   * The cost is that saving now needs a connection. A transaction cannot be
   * served from the local cache, so an order taken offline fails outright
   * rather than syncing later — deliberate, and the reason every caller awaits
   * this and keeps the cart until it resolves.
   */
  async function allocateRootNumber(transaction) {
    const counter = doc(db, ...COUNTER)
    const snapshot = await transaction.get(counter)
    const today = dayKey(new Date())
    const stored = snapshot.exists() ? snapshot.data() : null

    // Only ever move the day forward. A tablet whose clock is fast can roll the
    // counter over early; letting a slow one roll it back would restart at 1
    // while numbers from the day it skipped are still being handed out.
    const rollOver = !stored || stored.day < today
    const rootNumber = rollOver ? 1 : stored.next

    transaction.set(counter, { day: rollOver ? today : stored.day, next: rootNumber + 1 })
    return rootNumber
  }

  async function save({ table, people, lines }) {
    return runTransaction(db, async (transaction) => {
      const rootNumber = await allocateRootNumber(transaction)
      transaction.set(
        doc(collection(db, 'orders')),
        recordFor({
          name: `order-${rootNumber}`,
          rootNumber,
          extraNumber: null,
          table,
          people,
          lines,
        }),
      )
    })
  }

  /**
   * Each root counts its own extras, because a transaction can only read
   * documents — not query for the siblings already fired on this bill.
   *
   * A duplicate extra number would only mislabel a round, not merge bills, so
   * this runs in a transaction for its failure semantics rather than its
   * numbering: it reports being offline, where an awaited write would hang.
   */
  async function saveExtra({ rootNumber, table, people, lines }) {
    const root = rootOrder(rootNumber)
    if (!root) throw new Error(`order-${rootNumber} tidak ditemukan`)
    const rootRef = doc(db, 'orders', root.id)

    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(rootRef)
      const extraNumber = (snapshot.data()?.extraCount ?? 0) + 1

      transaction.update(rootRef, { extraCount: extraNumber })
      transaction.set(
        doc(collection(db, 'orders')),
        recordFor({
          name: `extra-${extraNumber}-order-${rootNumber}`,
          rootNumber,
          extraNumber,
          table,
          people,
          lines,
        }),
      )
    })
  }

  /** Orders are readable only while signed in, so the listener follows the session. */
  function subscribe() {
    if (unsubscribe) return
    const start = startOfDay(new Date())
    since.value = start
    const today = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
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
    since.value = null
  }

  return {
    orders,
    loaded,
    since,
    rootSummaries,
    count,
    rootOrder,
    orderFamily,
    referenceRounds,
    save,
    saveExtra,
    subscribe,
    unsubscribe: unsubscribeAll,
  }
})
