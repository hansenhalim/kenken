<script setup>
import BaseModal from '@/components/BaseModal.vue'
import { formatTime } from '@/lib/time'

defineProps({
  /** Root-order summaries from `pesanan.rootSummaries`, not raw order records. */
  orders: { type: Array, required: true },
  /** Adding to an order would collide with an in-progress cart, so rows lock. */
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'open'])
</script>

<template>
  <BaseModal @close="emit('close')">
    <h2 class="px-6 pt-6 pb-4 text-center text-xl font-extrabold tracking-wide text-emerald-700">
      DAFTAR PESANAN
    </h2>

    <p v-if="orders.length === 0" class="px-6 pb-6 text-center text-lg text-neutral-400">
      Belum ada pesanan
    </p>

    <div v-else class="max-h-80 overflow-y-auto">
      <button
        v-for="order in orders"
        :key="order.id"
        type="button"
        class="w-full border-t border-neutral-200 px-6 py-3 text-left disabled:opacity-40 active:bg-neutral-100 disabled:active:bg-transparent"
        :disabled="locked"
        @click="emit('open', order)"
      >
        <span class="flex items-baseline gap-2">
          <span class="min-w-0 flex-1 truncate text-xl font-bold text-neutral-900">
            {{ order.name }}
          </span>
          <span class="shrink-0 text-base text-neutral-500 tabular-nums">
            {{ formatTime(order.createdAt) }}
          </span>
        </span>
        <span class="mt-1 flex flex-wrap gap-1">
          <span class="rounded bg-neutral-100 px-2 py-0.5 text-base text-neutral-500">
            Nomor Meja {{ order.table }}/{{ order.people }}
          </span>
          <span class="rounded bg-neutral-100 px-2 py-0.5 text-base text-neutral-500">
            Dibuat oleh {{ order.createdBy }}
          </span>
          <span
            v-if="order.extraCount > 0"
            class="rounded bg-amber-100 px-2 py-0.5 text-base text-amber-900"
          >
            {{ order.extraCount }} tambahan
          </span>
        </span>
      </button>
    </div>

    <p v-if="locked && orders.length > 0" class="px-6 pt-3 text-center text-base text-neutral-400">
      Selesaikan atau hapus orderan berjalan dulu
    </p>

    <div class="mt-2 border-t border-neutral-200">
      <button
        type="button"
        class="w-full py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100"
        @click="emit('close')"
      >
        BATAL
      </button>
    </div>
  </BaseModal>
</template>
