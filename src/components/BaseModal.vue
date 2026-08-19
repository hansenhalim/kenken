<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits(['close'])

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-sm overflow-hidden rounded-md bg-white shadow-xl" role="dialog" aria-modal="true">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
