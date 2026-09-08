<script setup>
import { onMounted, ref } from 'vue'
import { ChevronDown, ChevronRight, Menu } from 'lucide-vue-next'
import AppDrawer from '@/components/AppDrawer.vue'
import { formatDay, formatTimestamp } from '@/lib/time'
import { useRiwayatStore } from '@/stores/riwayat'

const riwayat = useRiwayatStore()

const drawerOpen = ref(false)

/** Root order ids that are expanded to show their rounds. */
const expanded = ref(new Set())

function toggle(id) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

onMounted(() => {
  riwayat.reset()
  riwayat.loadNextDay()
})
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
      <section v-for="day in riwayat.days" :key="day.start.toISOString()">
        <h2
          class="sticky top-0 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-base font-bold text-neutral-500"
        >
          {{ formatDay(day.start) }}
        </h2>

        <p v-if="day.bills.length === 0" class="px-4 py-6 text-center text-lg text-neutral-400">
          Tidak ada orderan
        </p>

        <div v-for="bill in day.bills" :key="bill.id" class="border-b border-neutral-100">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-neutral-100"
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
              <span class="block truncate text-xl font-bold text-neutral-900">{{ bill.name }}</span>
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
              <span class="block text-base text-neutral-500">
                {{ formatTimestamp(bill.lastActivityAt) }}
              </span>
            </span>
          </button>

          <!-- Every round on this bill, oldest first, exactly as it was fired -->
          <div v-if="expanded.has(bill.id)" class="bg-neutral-50 pb-2">
            <div v-for="round in riwayat.roundsOf(day, bill.rootNumber)" :key="round.id">
              <p class="flex flex-wrap items-baseline gap-x-2 px-4 pt-3 pb-1">
                <span class="text-base font-bold text-neutral-500">{{ round.name }}</span>
                <span class="text-sm text-neutral-400">
                  {{ formatTimestamp(round.createdAt) }} &middot; {{ round.createdBy }}
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
          </div>
        </div>
      </section>

      <p v-if="riwayat.error" class="px-4 py-6 text-center text-lg text-red-600">
        {{ riwayat.error }}
      </p>

      <div class="p-4">
        <button
          type="button"
          class="w-full rounded-md border border-emerald-700 py-3 text-base font-bold tracking-wide text-emerald-700 active:bg-emerald-50 disabled:border-neutral-300 disabled:text-neutral-300"
          :disabled="riwayat.loading"
          @click="riwayat.loadNextDay()"
        >
          {{ riwayat.loading ? 'MEMUAT...' : 'MUAT HARI SEBELUMNYA' }}
        </button>
      </div>
    </main>

    <AppDrawer v-if="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>
