<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')

const canSubmit = computed(
  () => username.value.trim().length > 0 && password.value.length > 0 && !auth.busy,
)

async function submit() {
  if (!canSubmit.value) return
  if (await auth.signIn(username.value, password.value)) {
    router.replace(route.query.next ?? { name: 'orderan-baru' })
  }
}
</script>

<template>
  <div class="flex h-full flex-col justify-center bg-white px-8 font-sans">
    <h1 class="pb-8 text-center text-3xl font-extrabold tracking-wide text-emerald-700">
      KENKEN
    </h1>

    <form @submit.prevent="submit">
      <label for="nama-pengguna" class="block text-base text-neutral-500">Nama Pengguna</label>
      <input
        id="nama-pengguna"
        v-model="username"
        type="text"
        autocomplete="username"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        placeholder="Nama Pengguna"
        class="mt-2 w-full rounded-md border border-emerald-700 px-4 py-3 text-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >

      <label for="password" class="mt-5 block text-base text-neutral-500">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="Password"
        class="mt-2 w-full rounded-md border border-emerald-700 px-4 py-3 text-xl text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >

      <p v-if="auth.error" class="mt-4 rounded-md bg-red-50 px-4 py-3 text-base text-red-600">
        {{ auth.error }}
      </p>

      <button
        type="submit"
        class="mt-6 w-full rounded-md bg-emerald-700 py-4 text-base font-bold tracking-wide text-white active:bg-emerald-800 disabled:bg-neutral-300"
        :disabled="!canSubmit"
      >
        {{ auth.busy ? 'MASUK...' : 'MASUK' }}
      </button>
    </form>
  </div>
</template>
