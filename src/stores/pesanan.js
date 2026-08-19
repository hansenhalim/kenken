import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { currentUser } from '@/data/user'

const pad = (value) => String(value).padStart(2, '0')

function timestamp(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/**
 * Parked orders. A root order is `order-{n}`; anything added to it later is a
 * separate `extra-{m}-order-{n}` order that keeps rootNumber pointing back.
 * In memory for now; this is the seam a Firebase backend replaces later, so
 * keep reads and writes going through these actions.
 */
export const usePesananStore = defineStore('pesanan', () => {
  const orders = ref([])

  let nextNumber = 1

  const rootOrder = (rootNumber) =>
    orders.value.find((order) => order.rootNumber === rootNumber && !order.extraNumber)

  /** Root order plus every extra on it, oldest first — the full running bill. */
  const orderFamily = (rootNumber) =>
    orders.value
      .filter((order) => order.rootNumber === rootNumber)
      .slice()
      .reverse()

  const referenceLines = (rootNumber) =>
    orderFamily(rootNumber).flatMap((order) => order.lines)

  const nextExtraNumber = (rootNumber) =>
    orders.value.filter((order) => order.rootNumber === rootNumber && order.extraNumber).length + 1

  function save({ table, people, lines }) {
    const order = {
      id: `pesanan:${nextNumber}`,
      name: `order-${nextNumber}`,
      rootNumber: nextNumber,
      extraNumber: null,
      table,
      people,
      lines: lines.map((line) => ({ ...line })),
      createdBy: currentUser,
      createdAt: timestamp(),
    }
    nextNumber += 1
    orders.value.unshift(order)
    return order
  }

  function saveExtra({ rootNumber, table, people, lines }) {
    const extraNumber = nextExtraNumber(rootNumber)
    const order = {
      id: `pesanan:${rootNumber}:extra:${extraNumber}`,
      name: `extra-${extraNumber}-order-${rootNumber}`,
      rootNumber,
      extraNumber,
      table,
      people,
      lines: lines.map((line) => ({ ...line })),
      createdBy: currentUser,
      createdAt: timestamp(),
    }
    orders.value.unshift(order)
    return order
  }

  const count = computed(() => orders.value.length)

  return { orders, count, rootOrder, orderFamily, referenceLines, nextExtraNumber, save, saveExtra }
})
