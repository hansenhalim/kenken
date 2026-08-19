<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  query: { type: String, default: '' },
})

/** Split into alternating plain / matched chunks, case-insensitively. */
const chunks = computed(() => {
  const needle = props.query.trim().toLowerCase()
  if (!needle) return [{ text: props.text, match: false }]

  const haystack = props.text.toLowerCase()
  const result = []
  let cursor = 0

  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, cursor)) {
    if (at > cursor) result.push({ text: props.text.slice(cursor, at), match: false })
    result.push({ text: props.text.slice(at, at + needle.length), match: true })
    cursor = at + needle.length
  }

  if (cursor < props.text.length) result.push({ text: props.text.slice(cursor), match: false })
  return result
})
</script>

<template>
  <span
    v-for="(chunk, index) in chunks"
    :key="index"
    :class="chunk.match ? 'text-blue-600' : undefined"
  >{{ chunk.text }}</span>
</template>
