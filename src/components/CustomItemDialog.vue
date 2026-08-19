<script setup>
import { computed, ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const emit = defineEmits(['close', 'submit'])

const name = ref('')
const code = ref('')
const qty = ref(1)

const canSubmit = computed(() => name.value.trim().length > 0)

function submit() {
  if (!canSubmit.value) return
  emit('submit', { name: name.value.trim(), code: code.value.trim(), qty: qty.value })
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <h2 class="px-6 pt-6 pb-2 text-center text-xl font-extrabold tracking-wide text-neutral-600">
      ORDERAN TAMBAHAN
    </h2>

    <div class="space-y-3 px-6 pt-4 pb-2">
      <input
        v-model="name"
        type="text"
        placeholder="Barang atau jasa"
        class="w-full rounded-md border border-emerald-700 px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >
      <input
        v-model="code"
        type="text"
        placeholder="Kode"
        class="w-full rounded-md border border-emerald-700 px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >
    </div>

    <div class="flex items-center justify-between px-6 py-5">
      <button
        type="button"
        class="px-4 text-3xl font-light text-neutral-900 disabled:text-neutral-300"
        :disabled="qty <= 1"
        aria-label="Kurangi jumlah"
        @click="qty--"
      >
        &minus;
      </button>
      <span class="text-2xl font-bold text-neutral-900 tabular-nums">{{ qty }}</span>
      <button
        type="button"
        class="px-4 text-3xl font-light text-neutral-900"
        aria-label="Tambah jumlah"
        @click="qty++"
      >
        +
      </button>
    </div>

    <div class="flex border-t border-neutral-200">
      <button
        type="button"
        class="flex-1 border-r border-neutral-200 py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100"
        @click="emit('close')"
      >
        BATAL
      </button>
      <button
        type="button"
        class="flex-1 py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100 disabled:text-neutral-300 disabled:active:bg-transparent"
        :disabled="!canSubmit"
        @click="submit"
      >
        OK
      </button>
    </div>
  </BaseModal>
</template>
