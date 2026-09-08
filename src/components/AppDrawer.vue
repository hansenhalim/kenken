<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClipboardList, History, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const emit = defineEmits(['close'])

const auth = useAuthStore()
const cart = useCartStore()
const route = useRoute()
const router = useRouter()

/** The screen you are already on is marked, not hidden — a nav that changes
 *  shape between screens is harder to learn than one that doesn't. */
const itemClass = (name) =>
  route.name === name
    ? 'bg-emerald-50 font-bold text-emerald-700'
    : 'text-neutral-900 active:bg-neutral-100'

function go(name) {
  emit('close')
  if (route.name !== name) router.push({ name })
}

/** Signing out drops the in-memory cart, so it asks when there is something to lose. */
async function logOut() {
  if (cart.lines.length > 0 && !confirm('Orderan yang belum disimpan akan hilang. Keluar?')) {
    return
  }
  emit('close')
  cart.clear()
  await auth.logOut()
  router.push({ name: 'masuk' })
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex bg-black/50" @click.self="emit('close')">
      <aside
        class="flex h-full w-72 max-w-[80%] flex-col bg-white font-sans shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="border-b border-neutral-200 px-5 py-6">
          <p class="text-base text-neutral-500">Masuk sebagai</p>
          <p class="truncate pt-1 text-xl font-extrabold text-emerald-700">{{ auth.name }}</p>
        </div>

        <nav class="flex-1 py-2">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-5 py-4 text-left text-base"
            :class="itemClass('orderan-baru')"
            @click="go('orderan-baru')"
          >
            <ClipboardList :size="22" :stroke-width="2.5" class="text-emerald-700" />
            Orderan Baru
          </button>

          <!-- Admin-only in the UI: the rules still let any signed-in user read every order -->
          <button
            v-if="auth.isAdmin"
            type="button"
            class="flex w-full items-center gap-3 px-5 py-4 text-left text-base"
            :class="itemClass('riwayat')"
            @click="go('riwayat')"
          >
            <History :size="22" :stroke-width="2.5" class="text-emerald-700" />
            Riwayat Order
          </button>
        </nav>

        <button
          type="button"
          class="flex items-center gap-3 border-t border-neutral-200 px-5 py-4 text-left text-base font-bold tracking-wide text-red-600 active:bg-neutral-100"
          @click="logOut"
        >
          <LogOut :size="22" :stroke-width="2.5" />
          KELUAR
        </button>
      </aside>
    </div>
  </Teleport>
</template>
