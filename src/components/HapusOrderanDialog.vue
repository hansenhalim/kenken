<script setup>
import BaseModal from '@/components/BaseModal.vue'

const props = defineProps({
  /** The bill being removed, named as the waiter knows it. */
  name: { type: String, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm'])

/** Nothing may dismiss the dialog while the write it started is still running. */
function close() {
  if (!props.busy) emit('close')
}
</script>

<template>
  <BaseModal @close="close">
    <!-- The question carries the warning: there is no second line to soften it -->
    <h2 class="px-6 py-6 text-center text-xl font-extrabold tracking-wide text-red-600">
      Hapus {{ name }}?
    </h2>

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
        class="flex-1 py-4 text-base font-bold tracking-wide text-red-600 active:bg-red-50 disabled:text-neutral-300 disabled:active:bg-transparent"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ busy ? 'MENGHAPUS...' : 'HAPUS' }}
      </button>
    </div>
  </BaseModal>
</template>
