<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  line: { type: Object, required: true },
})

const emit = defineEmits(['close', 'submit', 'remove'])

const qty = ref(props.line.qty)
const note = ref(props.line.note ?? '')
const noteEnabled = ref(Boolean(props.line.note))

function submit() {
  emit('submit', { qty: qty.value, note: noteEnabled.value ? note.value.trim() : '' })
}
</script>

<template>
  <BaseModal @close="emit('close')">
    <div class="px-5 py-4">
      <p class="text-xl font-bold text-neutral-900">{{ line.name }}</p>
      <p v-if="line.code" class="text-base text-neutral-500">{{ line.code }}</p>
    </div>

    <div class="flex items-center justify-between border-y border-neutral-200 px-6 py-4">
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

    <div class="px-5 pt-4 pb-5">
      <label class="flex items-center gap-3 py-2 text-lg font-semibold text-neutral-900">
        <input
          v-model="noteEnabled"
          type="checkbox"
          class="size-5 accent-emerald-700"
        >
        tambah catatan singkat
      </label>

      <input
        v-if="noteEnabled"
        v-model="note"
        type="text"
        placeholder="Catatan"
        class="mt-2 w-full rounded-md border border-emerald-700 px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-2 focus:outline-emerald-700"
      >
    </div>

    <div class="flex border-t border-neutral-200">
      <button
        type="button"
        class="flex-1 border-r border-neutral-200 py-4 text-base font-bold tracking-wide text-red-600 active:bg-red-50"
        @click="emit('remove')"
      >
        HAPUS
      </button>
      <button
        type="button"
        class="flex-1 py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100"
        @click="submit"
      >
        OK
      </button>
    </div>
  </BaseModal>
</template>
