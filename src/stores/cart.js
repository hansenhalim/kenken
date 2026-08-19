import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * One cart line: { key, productId, name, code, qty, note }.
 * productId is null for one-off items added via ORDERAN TAMBAHAN.
 */
export const useCartStore = defineStore('cart', () => {
  const lines = ref([])

  /** set from the MEJA dialog when the transaction is confirmed */
  const meja = ref({ table: '', people: 1 })

  /**
   * When set, the cart is building an extra on an existing root order:
   * { rootNumber, rootName, referenceLines }. Reference lines are read-only.
   */
  const extraFor = ref(null)

  let nextKey = 1

  const totalQty = computed(() => lines.value.reduce((sum, line) => sum + line.qty, 0))

  const lineFor = (productId) => lines.value.find((line) => line.productId === productId)

  const qtyOf = (productId) => lineFor(productId)?.qty ?? 0

  const lineByKey = (key) => lines.value.find((line) => line.key === key)

  function add(product, amount = 1) {
    const existing = lineFor(product.id)
    if (existing) {
      existing.qty += amount
      return
    }
    lines.value.push({
      key: `line:${nextKey++}`,
      productId: product.id,
      name: product.name,
      code: product.code ?? '',
      qty: amount,
      note: '',
    })
  }

  function addCustom({ name, code = '', qty = 1 }) {
    lines.value.push({ key: `line:${nextKey++}`, productId: null, name, code, qty, note: '' })
  }

  function setQty(key, qty) {
    const line = lineByKey(key)
    if (!line) return
    if (qty > 0) {
      line.qty = qty
    } else {
      remove(key)
    }
  }

  function setNote(key, note) {
    const line = lineByKey(key)
    if (line) line.note = note
  }

  function remove(key) {
    lines.value = lines.value.filter((line) => line.key !== key)
  }

  function setMeja({ table, people }) {
    meja.value = { table, people }
  }

  /**
   * Start adding to an existing order. Its lines are kept as read-only
   * reference; only newly tapped items go into `lines`.
   */
  function startExtra({ rootNumber, rootName, referenceLines, table, people }) {
    lines.value = []
    meja.value = { table, people }
    extraFor.value = {
      rootNumber,
      rootName,
      referenceLines: referenceLines.map((line) => ({ ...line })),
    }
  }

  function exitExtra() {
    lines.value = []
    extraFor.value = null
    meja.value = { table: '', people: 1 }
  }

  function clear() {
    lines.value = []
    meja.value = { table: '', people: 1 }
    extraFor.value = null
  }

  return {
    lines,
    meja,
    extraFor,
    totalQty,
    qtyOf,
    lineByKey,
    add,
    addCustom,
    setQty,
    setNote,
    setMeja,
    startExtra,
    exitExtra,
    remove,
    clear,
  }
})
