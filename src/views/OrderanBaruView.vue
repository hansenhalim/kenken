<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, Menu, MoreVertical, Plus, Search, ShoppingBag, X } from 'lucide-vue-next'
import AppDrawer from '@/components/AppDrawer.vue'
import CustomItemDialog from '@/components/CustomItemDialog.vue'
import DaftarPesananDialog from '@/components/DaftarPesananDialog.vue'
import ProductListItem from '@/components/ProductListItem.vue'
import { products } from '@/data/products'
import { useCartStore } from '@/stores/cart'
import { usePesananStore } from '@/stores/pesanan'

const cart = useCartStore()
const pesanan = usePesananStore()
const router = useRouter()

const menuOpen = ref(false)
const drawerOpen = ref(false)
const customItemOpen = ref(false)
const daftarPesananOpen = ref(false)

const searching = ref(false)
const query = ref('')
const searchInput = ref(null)

const visibleProducts = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return products
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) ||
      product.code.toLowerCase().includes(needle),
  )
})

async function openSearch() {
  searching.value = true
  await nextTick()
  searchInput.value?.focus()
}

function closeSearch() {
  searching.value = false
  query.value = ''
}

function clearQuery() {
  query.value = ''
  searchInput.value?.focus()
}

function clearOrderan() {
  cart.clear()
  menuOpen.value = false
}

function exitExtra() {
  cart.exitExtra()
}

function openDaftarPesanan() {
  daftarPesananOpen.value = true
  menuOpen.value = false
}

function openPesanan(order) {
  const root = pesanan.rootOrder(order.rootNumber) ?? order
  cart.startExtra({
    rootNumber: root.rootNumber,
    rootName: root.name,
    referenceRounds: pesanan.referenceRounds(root.rootNumber),
    table: root.table,
    people: root.people,
  })
  daftarPesananOpen.value = false
  router.push({ name: 'keranjang' })
}

function addCustomItem(item) {
  cart.addCustom(item)
  customItemOpen.value = false
}
</script>

<template>
  <div class="flex h-full flex-col bg-white font-sans">
    <!-- Header -->
    <header
      class="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-2.5"
    >
      <button
        type="button"
        class="p-2 text-emerald-700"
        aria-label="Buka menu"
        @click="drawerOpen = true"
      >
        <Menu :size="26" :stroke-width="2.5" />
      </button>

      <h1 class="flex-1 text-center text-xl font-extrabold tracking-wide text-emerald-700">
        ORDERAN BARU
      </h1>

      <div class="relative">
        <button
          type="button"
          class="relative p-2 text-emerald-700"
          aria-label="Opsi lainnya"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <MoreVertical :size="24" :stroke-width="2.5" />

          <span
            v-if="pesanan.count > 0"
            class="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-neutral-900 tabular-nums"
          >
            {{ pesanan.count }}
          </span>
        </button>

        <div
          v-if="menuOpen"
          class="absolute top-full right-0 z-20 mt-1 min-w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            class="w-full px-4 py-3 text-left text-base text-neutral-900 active:bg-neutral-100"
            @click="clearOrderan"
          >
            Clear orderan
          </button>

          <button
            type="button"
            role="menuitem"
            class="w-full px-4 py-3 text-left text-base text-neutral-900 active:bg-neutral-100"
            @click="openDaftarPesanan"
          >
            Daftar Pesanan{{ pesanan.count > 0 ? ` (${pesanan.count})` : '' }}
          </button>
        </div>
      </div>
    </header>

    <!-- A rejected write is unrecoverable: the cart was cleared on save -->
    <div
      v-if="pesanan.saveError"
      class="flex shrink-0 items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2"
    >
      <span class="min-w-0 flex-1 text-base font-semibold text-red-700">
        {{ pesanan.saveError }}
      </span>
      <button
        type="button"
        class="shrink-0 p-1 text-red-700"
        aria-label="Tutup peringatan"
        @click="pesanan.clearSaveError()"
      >
        <X :size="22" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Extra mode: every tap below adds to a new extra on this order -->
    <div
      v-if="cart.extraFor"
      class="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2"
    >
      <span class="min-w-0 flex-1 truncate text-base font-semibold text-amber-900">
        Menambah ke {{ cart.extraFor.rootName }}
      </span>
      <button
        type="button"
        class="shrink-0 p-1 text-amber-900"
        aria-label="Keluar dari mode tambahan"
        @click="exitExtra"
      >
        <X :size="22" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Backdrop that closes the kebab menu on an outside tap -->
    <div v-if="menuOpen" class="fixed inset-0 z-10" @click="menuOpen = false" />

    <!-- Search bar, in place of the toolbar -->
    <div
      v-if="searching"
      class="flex shrink-0 items-center gap-3 border-b border-neutral-200 py-3 pr-3 pl-4"
    >
      <input
        ref="searchInput"
        v-model="query"
        type="text"
        placeholder="Cari nama atau kode"
        class="min-w-0 flex-1 text-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        @keydown.esc="closeSearch"
      >

      <button
        type="button"
        class="shrink-0 rounded-md bg-red-50 px-4 py-2 text-lg font-semibold text-red-600 active:bg-red-100"
        @click="clearQuery"
      >
        Hapus
      </button>

      <button
        type="button"
        class="shrink-0 p-1 text-emerald-700"
        aria-label="Tutup pencarian"
        @click="closeSearch"
      >
        <X :size="28" :stroke-width="2.25" />
      </button>
    </div>

    <!-- Action toolbar -->
    <div v-else class="flex shrink-0 items-stretch border-b border-neutral-200">
      <div class="flex flex-1 items-center gap-6 px-4 py-3 text-emerald-700">
        <button type="button" class="p-1" aria-label="Cari produk" @click="openSearch">
          <Search :size="28" :stroke-width="2.25" />
        </button>
        <button
          type="button"
          class="p-1"
          aria-label="Tambah orderan tambahan"
          @click="customItemOpen = true"
        >
          <Plus :size="28" :stroke-width="2.25" />
        </button>
      </div>

      <button
        type="button"
        class="flex items-center gap-3 border-l border-neutral-200 px-4 py-3"
      >
        <span class="text-xl font-semibold text-neutral-800">Semua item</span>
        <ChevronDown :size="26" :stroke-width="2.25" class="text-emerald-700" />
      </button>
    </div>

    <!-- Product list -->
    <main class="min-h-0 flex-1 overflow-y-auto py-2">
      <p
        v-if="visibleProducts.length === 0"
        class="px-4 py-10 text-center text-lg text-neutral-400"
      >
        Tidak ada item
      </p>

      <ProductListItem
        v-for="product in visibleProducts"
        :key="product.id"
        :name="product.name"
        :qty="cart.qtyOf(product.id)"
        :highlight="query"
        @add="cart.add(product)"
      />
    </main>

    <!-- Cart FAB -->
    <button
      type="button"
      class="fixed right-6 bottom-6 flex size-16 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-transform active:scale-95 disabled:bg-neutral-300 disabled:active:scale-100"
      aria-label="Lihat keranjang"
      :disabled="cart.totalQty === 0"
      @click="router.push({ name: 'keranjang' })"
    >
      <ShoppingBag :size="30" :stroke-width="2" />

      <span
        v-if="cart.totalQty > 0"
        class="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-neutral-900 tabular-nums"
      >
        {{ cart.totalQty }}
      </span>
    </button>

    <AppDrawer v-if="drawerOpen" @close="drawerOpen = false" />

    <CustomItemDialog
      v-if="customItemOpen"
      @close="customItemOpen = false"
      @submit="addCustomItem"
    />

    <DaftarPesananDialog
      v-if="daftarPesananOpen"
      :orders="pesanan.rootSummaries"
      :locked="cart.lines.length > 0"
      @close="daftarPesananOpen = false"
      @open="openPesanan"
    />
  </div>
</template>
