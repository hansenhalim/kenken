<script setup>
import { computed, ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  table: { type: String, default: '' },
  people: { type: Number, default: 1 },
  /** Set while the order is being written; the dialog is the only thing that waits. */
  busy: { type: Boolean, default: false },
  /** Why the last attempt failed, shown here so retrying is one tap. */
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const table = ref(props.table)
const people = ref(props.people)

const canSubmit = computed(() => table.value.trim().length > 0 && !props.busy)

function submit() {
  if (!canSubmit.value) return
  emit('submit', { table: table.value.trim(), people: people.value })
}

/** Backdrop and Escape close the dialog, but not out from under a write in flight. */
function close() {
  if (!props.busy) emit('close')
}
</script>

<template>
  <BaseModal @close="close">
    <h2 class="px-6 pt-6 pb-2 text-center text-xl font-extrabold tracking-wide text-neutral-600">
      MEJA
    </h2>

    <div class="px-6 pt-4">
      <label for="nomor-meja" class="block text-base text-neutral-500">Nomor Meja</label>
      <input
        id="nomor-meja"
        v-model="table"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        placeholder="Nomor Meja"
        class="mt-2 w-full rounded-md border border-emerald-700 px-4 py-3 text-center text-2xl text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >
    </div>

    <div class="px-6 pt-5 pb-5">
      <p class="text-base text-neutral-500">Jumlah Orang</p>

      <div class="flex items-center justify-between pt-2">
        <button
          type="button"
          class="px-4 text-3xl font-light text-neutral-900 disabled:text-neutral-300"
          :disabled="people <= 1"
          aria-label="Kurangi jumlah orang"
          @click="people--"
        >
          &minus;
        </button>
        <span class="text-2xl font-bold text-neutral-900 tabular-nums">{{ people }}</span>
        <button
          type="button"
          class="px-4 text-3xl font-light text-neutral-900"
          aria-label="Tambah jumlah orang"
          @click="people++"
        >
          +
        </button>
      </div>
    </div>

    <p v-if="error" class="px-6 pb-4 text-center text-base text-red-600">{{ error }}</p>

    <div class="flex border-t border-neutral-200">
      <button
        type="button"
        class="flex-1 border-r border-neutral-200 py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100 disabled:text-neutral-300 disabled:active:bg-transparent"
        :disabled="busy"
        @click="close"
      >
        BATAL
      </button>
      <button
        type="button"
        class="flex-1 py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100 disabled:text-neutral-300 disabled:active:bg-transparent"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ busy ? 'MENYIMPAN...' : 'OK' }}
      </button>
    </div>
  </BaseModal>
</template>
