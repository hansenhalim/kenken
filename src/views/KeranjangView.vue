<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, Trash2 } from 'lucide-vue-next'
import HapusOrderanDialog from '@/components/HapusOrderanDialog.vue'
import ItemDetailDialog from '@/components/ItemDetailDialog.vue'
import MejaDialog from '@/components/MejaDialog.vue'
import { formatTime } from '@/lib/time'
import { useCartStore } from '@/stores/cart'
import { usePesananStore } from '@/stores/pesanan'

const cart = useCartStore()
const pesanan = usePesananStore()
const router = useRouter()

const openKey = ref(null)
const mejaOpen = ref(false)
const saving = ref(false)
const saveError = ref('')

const hapusOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')

/** Extras are saved as their own record, but the UI only ever names the root. */
const title = computed(() =>
  cart.extraFor ? cart.extraFor.rootName : `${cart.totalQty} ITEM`,
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

/**
 * Waits for the order to reach the server before letting go of it. Numbers are
 * allocated in a transaction, so a save can fail outright — clearing the cart
 * first would lose the order with no way to retype it.
 */
async function applyMeja(meja) {
  if (saving.value) return
  saving.value = true
  saveError.value = ''

  try {
    if (cart.extraFor) {
      await pesanan.saveExtra({ rootNumber: cart.extraFor.rootNumber, ...meja, lines: cart.lines })
    } else {
      await pesanan.save({ ...meja, lines: cart.lines })
    }
  } catch (failure) {
    saveError.value =
      failure.code === 'unavailable'
        ? 'Butuh koneksi untuk menyimpan orderan'
        : 'Gagal menyimpan, coba lagi'
    return
  } finally {
    saving.value = false
  }

  cart.clear()
  mejaOpen.value = false
  router.push({ name: 'orderan-baru' })
}

/**
 * Only reachable in extra mode, where there is a saved bill to remove. The
 * order is hidden rather than destroyed, so RIWAYAT keeps the record.
 */
async function hapusOrderan() {
  if (deleting.value) return
  deleting.value = true
  deleteError.value = ''

  try {
    await pesanan.remove(cart.extraFor.rootNumber)
  } catch (failure) {
    deleteError.value =
      failure.code === 'unavailable'
        ? 'Butuh koneksi untuk menghapus'
        : 'Gagal menghapus, coba lagi'
    return
  } finally {
    deleting.value = false
  }

  cart.clear()
  hapusOpen.value = false
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
        :disabled="cart.lines.length === 0 || (!!cart.extraFor && !pesanan.loaded)"
        @click="mejaOpen = true"
      >
        <Check :size="28" :stroke-width="3" />
      </button>
    </header>

    <!-- Cart lines -->
    <main class="min-h-0 flex-1 overflow-y-auto py-2">
      <template v-if="cart.extraFor">
        <!-- One block per round already fired on this order, oldest first -->
        <div v-for="round in cart.extraFor.referenceRounds" :key="round.id" class="pb-2">
          <p class="flex flex-wrap items-baseline gap-x-2 px-4 pt-2 pb-1">
            <span class="text-base font-bold text-neutral-500">{{ round.name }}</span>
            <span class="text-sm text-neutral-400">
              {{ formatTime(round.createdAt) }} &middot; {{ round.createdBy }}
            </span>
          </p>

          <div
            v-for="line in round.lines"
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
        </div>

        <!-- Unsaved, so deliberately unnamed: its extra number isn't settled yet -->
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

    <!-- Extra mode only: without a saved bill there is nothing to delete -->
    <button
      v-if="cart.extraFor"
      type="button"
      class="fixed right-6 bottom-6 flex size-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform active:scale-95"
      aria-label="Hapus orderan"
      @click="hapusOpen = true"
    >
      <Trash2 :size="28" :stroke-width="2" />
    </button>

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
      :busy="saving"
      :error="saveError"
      @close="mejaOpen = false"
      @submit="applyMeja"
    />

    <HapusOrderanDialog
      v-if="hapusOpen"
      :name="cart.extraFor.rootName"
      :busy="deleting"
      :error="deleteError"
      @close="hapusOpen = false"
      @confirm="hapusOrderan"
    />
  </div>
</template>
