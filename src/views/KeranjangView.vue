<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'
import ItemDetailDialog from '@/components/ItemDetailDialog.vue'
import MejaDialog from '@/components/MejaDialog.vue'
import { useCartStore } from '@/stores/cart'
import { usePesananStore } from '@/stores/pesanan'

const cart = useCartStore()
const pesanan = usePesananStore()
const router = useRouter()

const openKey = ref(null)
const mejaOpen = ref(false)

const extraName = computed(() => {
  if (!cart.extraFor) return ''
  const next = pesanan.nextExtraNumber(cart.extraFor.rootNumber)
  return `extra-${next}-${cart.extraFor.rootName}`
})

const title = computed(() =>
  cart.extraFor ? extraName.value : `${cart.totalQty} ITEM`,
)

function applyDetail({ qty, note }) {
  cart.setQty(openKey.value, qty)
  cart.setNote(openKey.value, note)
  openKey.value = null
}

function removeLine() {
  cart.remove(openKey.value)
  openKey.value = null
}

function applyMeja(meja) {
  if (cart.extraFor) {
    pesanan.saveExtra({ rootNumber: cart.extraFor.rootNumber, ...meja, lines: cart.lines })
  } else {
    pesanan.save({ ...meja, lines: cart.lines })
  }
  cart.clear()
  mejaOpen.value = false
  router.push({ name: 'orderan-baru' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-white font-sans">
    <!-- Header -->
    <header class="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-2.5">
      <button
        type="button"
        class="p-2 text-emerald-600"
        aria-label="Kembali"
        @click="router.back()"
      >
        <ArrowLeft :size="26" :stroke-width="2.5" />
      </button>

      <h1 class="flex-1 truncate text-center text-xl font-extrabold tracking-wide text-neutral-500">
        {{ title }}
      </h1>

      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-md bg-emerald-700 text-white disabled:bg-neutral-300"
        aria-label="Selesaikan orderan"
        :disabled="cart.lines.length === 0"
        @click="mejaOpen = true"
      >
        <Check :size="28" :stroke-width="3" />
      </button>
    </header>

    <!-- Cart lines -->
    <main class="min-h-0 flex-1 overflow-y-auto py-2">
      <template v-if="cart.extraFor">
        <p class="px-4 pt-2 pb-1 text-sm font-bold tracking-wide text-neutral-400">
          REFERENSI &middot; {{ cart.extraFor.rootName }}
        </p>

        <div
          v-for="line in cart.extraFor.referenceLines"
          :key="line.key"
          class="flex h-14 items-center gap-4 px-4 text-neutral-400"
        >
          <span class="min-w-0 flex-1 truncate text-lg font-bold">{{ line.name }}</span>
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-base font-bold tabular-nums"
          >
            {{ line.qty }}
          </span>
        </div>

        <p class="border-t border-neutral-200 px-4 pt-3 pb-1 text-sm font-bold tracking-wide text-neutral-400">
          TAMBAHAN
        </p>
      </template>

      <p v-if="cart.lines.length === 0" class="px-4 py-10 text-center text-lg text-neutral-400">
        Belum ada item
      </p>

      <button
        v-for="line in cart.lines"
        :key="line.key"
        type="button"
        class="flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left transition-colors active:bg-neutral-100"
        @click="openKey = line.key"
      >
        <span class="min-w-0 flex-1">
          <span class="block truncate text-lg font-bold text-neutral-900">{{ line.name }}</span>
          <span v-if="line.note" class="block truncate text-base text-neutral-500">{{ line.note }}</span>
        </span>

        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-300 text-base font-bold text-neutral-900 tabular-nums"
        >
          {{ line.qty }}
        </span>
      </button>
    </main>

    <ItemDetailDialog
      v-if="openKey"
      :line="cart.lineByKey(openKey)"
      @close="openKey = null"
      @submit="applyDetail"
      @remove="removeLine"
    />

    <MejaDialog
      v-if="mejaOpen"
      :table="cart.meja.table"
      :people="cart.meja.people"
      @close="mejaOpen = false"
      @submit="applyMeja"
    />
  </div>
</template>
