import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Timestamp, collection, getDocsFromServer, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { familyOf, orderFromDoc, summarizeRoots } from '@/lib/orders'

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const dayBefore = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)

const dayAfter = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

/**
 * Order history, one calendar day per load. Days are fetched whole rather than
 * in fixed-size pages so every bill arrives with its extras attached — a page
 * boundary through a family would report the wrong tambahan count.
 *
 * Deliberately separate from `pesanan`: that store's `orders` drives live
 * numbering and DAFTAR PESANAN, and pouring old orders into it would push both
 * of them off.
 */
export const useRiwayatStore = defineStore('riwayat', () => {
  /** Newest first: `{ start, orders, bills }`, one entry per day loaded. */
  const days = ref([])
  const loading = ref(false)
  const error = ref('')

  const roundsOf = (day, rootNumber) => familyOf(day.orders, rootNumber)

  /**
   * Reads from the server, never the cache. Only today is cached, so a cached
   * read of last Tuesday would return an empty day that looks exactly like a
   * day with no orders — a wrong answer rather than a missing one.
   */
  async function loadNextDay() {
    if (loading.value) return
    loading.value = true
    error.value = ''

    const start = days.value.length ? dayBefore(days.value[days.value.length - 1].start) : startOfDay(new Date())

    try {
      const snapshot = await getDocsFromServer(
        query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<', Timestamp.fromDate(dayAfter(start))),
          orderBy('createdAt', 'desc'),
        ),
      )
      const orders = snapshot.docs.map(orderFromDoc)
      days.value.push({ start, orders, bills: summarizeRoots(orders) })
    } catch (failure) {
      error.value =
        failure.code === 'unavailable'
          ? 'Butuh koneksi untuk melihat riwayat'
          : 'Gagal memuat riwayat, coba lagi'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    days.value = []
    error.value = ''
  }

  return { days, loading, error, roundsOf, loadNextDay, reset }
})
