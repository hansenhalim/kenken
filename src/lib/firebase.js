import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

/** Not a secret: the web config ships in the bundle, rules do the guarding. */
const firebaseConfig = {
  apiKey: 'AIzaSyDZmtppblACvem3vkWBonJ7u6k3WCAp66I',
  authDomain: 'kenkenseafood.firebaseapp.com',
  projectId: 'kenkenseafood',
  storageBucket: 'kenkenseafood.firebasestorage.app',
  messagingSenderId: '441540753535',
  appId: '1:441540753535:web:0f3b6574757b4f9863274a',
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

/**
 * Restaurant wifi drops. A persistent cache keeps today's orders on screen
 * while it is down and holds writes fired offline across a reload, so a blip
 * costs nothing instead of losing an order.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
