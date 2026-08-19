import { createRouter, createWebHistory } from 'vue-router'
import OrderanBaruView from '@/views/OrderanBaruView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'orderan-baru', component: OrderanBaruView },
    {
      path: '/keranjang',
      name: 'keranjang',
      component: () => import('@/views/KeranjangView.vue'),
    },
  ],
})
