<script setup>
import { ref } from 'vue'
import { ChevronDown, ChevronRight, Menu } from 'lucide-vue-next'
import AppDrawer from '@/components/AppDrawer.vue'
import { formatDay, formatTime } from '@/lib/time'
import { usePesananStore } from '@/stores/pesanan'

/**
 * Today's orders, read straight off the live listener the app already runs, so
 * a round fired on a waiter's tablet lands here as it is saved.
 *
 * Today is the whole screen: earlier days were dropped along with the paging
 * that fetched them, so there is no second source to keep in step with this one.
 */
const pesanan = usePesananStore()

const drawerOpen = ref(false)

/** Root order ids that are expanded to show their rounds. */
const expanded = ref(new Set())

function toggle(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

/** The bill being marked, and where the last failure belongs — one panel acts at a time. */
const acking = ref(null)
const ackError = ref(null)

/**
 * Marking closes the bill: the admin is done with it, and the row greying as it
 * collapses is the confirmation. A failure keeps the panel open instead, since
 * there is no undo to correct a mark that only looked like it landed.
 */
async function acknowledge(bill) {
  if (acking.value) return
  acking.value = bill.id
  ackError.value = null

  try {
    await pesanan.acknowledge(bill.rootNumber)
  } catch (failure) {
    ackError.value = {
      id: bill.id,
      message:
        failure.code === 'unavailable'
          ? 'Butuh koneksi untuk menandai'
          : 'Gagal menandai, coba lagi',
    }
    return
  } finally {
    acking.value = null
  }

  toggle(bill.id)
}
</script>

<template>
  <div class="flex h-full flex-col bg-white font-sans">
    <!-- Header -->
    <header class="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-2.5">
      <button
        type="button"
        class="p-2 text-emerald-700"
        aria-label="Buka menu"
        @click="drawerOpen = true"
      >
        <Menu :size="26" :stroke-width="2.5" />
      </button>

      <h1 class="flex-1 text-center text-xl font-extrabold tracking-wide text-emerald-700">
        RIWAYAT ORDER
      </h1>

      <span class="w-10" />
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto">
      <!-- Dated from the listener, not the clock: a tablet left open past
           midnight keeps serving the day it started on, and says so. -->
      <h2
        v-if="pesanan.since"
        class="sticky top-0 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-base font-bold text-neutral-500"
      >
        {{ formatDay(pesanan.since) }}
      </h2>

      <!-- An empty list before the first snapshot means "not yet", not "none" -->
      <p v-if="!pesanan.loaded" class="px-4 py-6 text-center text-lg text-neutral-400">
        Memuat...
      </p>

      <p
        v-else-if="pesanan.rootSummaries.length === 0"
        class="px-4 py-6 text-center text-lg text-neutral-400"
      >
        Tidak ada orderan
      </p>

      <div
        v-for="bill in pesanan.rootSummaries"
        :key="bill.id"
        class="border-b border-neutral-100"
      >
        <!-- Dimmed as a whole rather than recoloured piece by piece, so the
             badges keep their own meaning and nothing drifts out of step. -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-neutral-100"
          :class="{ 'opacity-50': bill.acked }"
          :aria-expanded="expanded.has(bill.id)"
          @click="toggle(bill.id)"
        >
          <component
            :is="expanded.has(bill.id) ? ChevronDown : ChevronRight"
            :size="22"
            :stroke-width="2.5"
            class="shrink-0 text-neutral-400"
          />

          <span class="min-w-0 flex-1">
            <span class="flex items-baseline gap-2">
              <span class="min-w-0 flex-1 truncate text-xl font-bold text-neutral-900">
                {{ bill.name }}
              </span>
              <span class="shrink-0 text-base text-neutral-500 tabular-nums">
                {{ formatTime(bill.createdAt) }}
              </span>
            </span>
            <span class="mt-1 flex flex-wrap gap-1">
              <span class="rounded bg-neutral-100 px-2 py-0.5 text-base text-neutral-500">
                Nomor Meja {{ bill.table }}/{{ bill.people }}
              </span>
              <span class="rounded bg-neutral-100 px-2 py-0.5 text-base text-neutral-500">
                Dibuat oleh {{ bill.createdBy }}
              </span>
              <span
                v-if="bill.extraCount > 0"
                class="rounded bg-amber-100 px-2 py-0.5 text-base text-amber-900"
              >
                {{ bill.extraCount }} tambahan
              </span>
            </span>
          </span>
        </button>

        <!-- Every round on this bill, oldest first, exactly as it was fired -->
        <div v-if="expanded.has(bill.id)" class="bg-neutral-50 pb-2">
          <div v-for="round in pesanan.orderFamily(bill.rootNumber)" :key="round.id">
            <p class="flex flex-wrap items-baseline gap-x-2 px-4 pt-3 pb-1">
              <span class="text-base font-bold text-neutral-500">{{ round.name }}</span>
              <span class="text-sm text-neutral-400">
                {{ formatTime(round.createdAt) }} &middot; {{ round.createdBy }}
              </span>
            </p>

            <div
              v-for="line in round.lines"
              :key="line.key"
              class="flex min-h-11 items-center gap-4 px-4 py-1"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-base font-bold text-neutral-700">
                  {{ line.name }}
                </span>
                <span v-if="line.note" class="block truncate text-base text-neutral-500">
                  {{ line.note }}
                </span>
              </span>
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-300 text-base font-bold text-neutral-700 tabular-nums"
              >
                {{ line.qty }}
              </span>
            </div>
          </div>

          <!-- Below the rounds: marking a bill means having read them -->
          <div class="px-4 pt-3">
            <p v-if="bill.acked" class="py-1 text-center text-base text-neutral-400">
              Sudah diproses
            </p>

            <template v-else>
              <button
                type="button"
                class="w-full rounded-md border border-emerald-700 py-3 text-base font-bold tracking-wide text-emerald-700 active:bg-emerald-50 disabled:border-neutral-300 disabled:text-neutral-300"
                :disabled="acking === bill.id"
                @click="acknowledge(bill)"
              >
                {{ acking === bill.id ? 'MENANDAI...' : 'TANDAI SUDAH DIPROSES' }}
              </button>

              <p
                v-if="ackError && ackError.id === bill.id"
                class="pt-2 text-center text-base text-red-600"
              >
                {{ ackError.message }}
              </p>
            </template>
          </div>
        </div>
      </div>
    </main>

    <AppDrawer v-if="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>
