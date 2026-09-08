import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { usePesananStore } from './stores/pesanan'
import './assets/main.css'

const pinia = createPinia()
const auth = useAuthStore(pinia)
const pesanan = usePesananStore(pinia)

// Orders are readable only while signed in, so the listener follows the session
// and drops what it holds on the way out.
watch(
  () => auth.signedIn,
  (signedIn) => (signedIn ? pesanan.subscribe() : pesanan.unsubscribe()),
  { immediate: true },
)

// Restoring a persisted session is a local read, so this is imperceptible — and
// it means the router guard never bounces a signed-in waiter to the login screen.
auth.init().then(() => {
  createApp(App).use(pinia).use(router).mount('#app')
})
