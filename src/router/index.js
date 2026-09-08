import { createRouter, createWebHistory } from 'vue-router'
import OrderanBaruView from '@/views/OrderanBaruView.vue'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'orderan-baru', component: OrderanBaruView },
    {
      path: '/keranjang',
      name: 'keranjang',
      component: () => import('@/views/KeranjangView.vue'),
    },
    {
      path: '/riwayat',
      name: 'riwayat',
      component: () => import('@/views/RiwayatView.vue'),
    },
    {
      path: '/masuk',
      name: 'masuk',
      component: () => import('@/views/MasukView.vue'),
    },
  ],
})

/**
 * The app mounts only after the first auth state has settled, so this can read
 * the session synchronously and never flashes the wrong screen.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.name !== 'masuk' && !auth.signedIn) {
    return { name: 'masuk', query: { next: to.fullPath } }
  }
  if (to.name === 'masuk' && auth.signedIn) return { name: 'orderan-baru' }
  // Covers a typed URL as well as the hidden menu item — though only in the UI:
  // the rules still let any signed-in user read every order.
  if (to.name === 'riwayat' && !auth.isAdmin) return { name: 'orderan-baru' }
})
