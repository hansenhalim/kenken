<script setup>
import BaseModal from '@/components/BaseModal.vue'

defineProps({
  /** `{ name, count }` per category, already ordered, named as the till names them. */
  categories: { type: Array, required: true },
  /** Size of the whole menu, for the row that clears the filter. */
  total: { type: Number, required: true },
  /** The chosen category's raw name, or null while the whole menu is showing. */
  selected: { type: String, default: null },
})

const emit = defineEmits(['close', 'select'])

const rowClass = (active) =>
  active ? 'bg-emerald-50 font-bold text-emerald-700' : 'text-neutral-900 active:bg-neutral-100'
</script>

<template>
  <BaseModal @close="emit('close')">
    <h2 class="px-6 pt-6 pb-4 text-center text-xl font-extrabold tracking-wide text-emerald-700">
      KATEGORI
    </h2>

    <div class="max-h-80 overflow-y-auto border-t border-neutral-200">
      <button
        type="button"
        class="flex w-full items-baseline gap-3 px-6 py-3 text-left"
        :class="rowClass(selected === null)"
        @click="emit('select', null)"
      >
        <span class="min-w-0 flex-1 truncate text-lg">Semua item</span>
        <span class="shrink-0 text-base text-neutral-500 tabular-nums">{{ total }}</span>
      </button>

      <button
        v-for="category in categories"
        :key="category.name"
        type="button"
        class="flex w-full items-baseline gap-3 border-t border-neutral-100 px-6 py-3 text-left"
        :class="rowClass(selected === category.name)"
        @click="emit('select', category)"
      >
        <span class="min-w-0 flex-1 truncate text-lg">{{ category.name }}</span>
        <span class="shrink-0 text-base text-neutral-500 tabular-nums">{{ category.count }}</span>
      </button>
    </div>

    <div class="border-t border-neutral-200">
      <button
        type="button"
        class="w-full py-4 text-base font-bold tracking-wide text-emerald-700 active:bg-neutral-100"
        @click="emit('close')"
      >
        BATAL
      </button>
    </div>
  </BaseModal>
</template>
