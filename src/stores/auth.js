import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

/**
 * Accounts are login IDs, not mailboxes: staff type `hansen` and we sign in as
 * `hansen@kenken.id`. Nothing is ever delivered to these addresses, so there is
 * deliberately no password-reset link — an owner resets one in the console.
 */
const DOMAIN = 'kenken.id'

/** The one account that may open RIWAYAT ORDER. */
const ADMIN_EMAIL = 'admin@kenken.id'

/**
 * Email enumeration protection is on for this project, so a wrong name and a
 * wrong password both arrive as `invalid-credential`. Only the codes below
 * change what the waiter should do next; everything else is a generic failure.
 */
const MESSAGES = {
  'auth/invalid-credential': 'Nama pengguna atau password salah',
  'auth/invalid-email': 'Nama pengguna tidak valid',
  'auth/user-disabled': 'Akun ini sudah dinonaktifkan',
  'auth/too-many-requests': 'Terlalu banyak percobaan, tunggu sebentar',
  'auth/network-request-failed': 'Tidak ada koneksi, periksa jaringan',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const error = ref('')
  const busy = ref(false)

  const signedIn = computed(() => user.value !== null)

  /** There are no profile records: the name on every bill is the login ID. */
  const name = computed(() => user.value?.email?.split('@')[0] ?? '')

  /**
   * A UI gate, not a security boundary: rules let any signed-in user read every
   * order, so this hides the screen rather than the data.
   */
  const isAdmin = computed(() => user.value?.email === ADMIN_EMAIL)

  /**
   * Resolves once Firebase has restored a persisted session or ruled one out.
   * The router guard reads `signedIn` synchronously, so nothing may render
   * before this settles.
   */
  function init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (next) => {
        user.value = next
        resolve()
      })
    })
  }

  async function signIn(username, password) {
    busy.value = true
    error.value = ''
    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithEmailAndPassword(auth, `${username.trim()}@${DOMAIN}`, password)
      return true
    } catch (failure) {
      error.value = MESSAGES[failure.code] ?? 'Gagal masuk, coba lagi'
      return false
    } finally {
      busy.value = false
    }
  }

  async function logOut() {
    await signOut(auth)
  }

  return { user, error, busy, signedIn, name, isAdmin, init, signIn, logOut }
})
