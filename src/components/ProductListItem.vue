<script setup>
import HighlightedText from '@/components/HighlightedText.vue'

defineProps({
  name: { type: String, required: true },
  qty: { type: Number, default: 0 },
  highlight: { type: String, default: '' },
})

defineEmits(['add'])
</script>

<template>
  <button
    type="button"
    class="flex h-14 w-full items-center gap-4 px-4 text-left transition-colors active:bg-neutral-100"
    @click="$emit('add')"
  >
    <span class="min-w-0 flex-1 truncate text-lg font-bold text-neutral-900">
      <HighlightedText :text="name" :query="highlight" />
    </span>

    <span
      v-if="qty > 0"
      class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-300 text-base font-bold text-neutral-900 tabular-nums"
    >
      {{ qty }}
    </span>
  </button>
</template>
