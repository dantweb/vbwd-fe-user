<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    :class="['formatted-message', { 'has-links': formatted.hasLinks }]"
    v-html="formatted.html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatMarkdown } from '../utils/markdownFormatter';

interface Props {
  content: string;
}

const props = defineProps<Props>();

const formatted = computed(() => {
  return formatMarkdown(props.content);
});
</script>

<style scoped>
.formatted-message {
  color: var(--color-text-primary, #2c3e50);
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.formatted-message :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem 0;
  color: var(--color-primary, #3b82f6);
}

.formatted-message :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.875rem 0 0.5rem 0;
  color: var(--color-primary, #3b82f6);
}

.formatted-message :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.75rem 0 0.4rem 0;
  color: var(--color-primary, #3b82f6);
}

.formatted-message :deep(strong) {
  font-weight: 700;
  color: var(--color-text-primary, #2c3e50);
}

.formatted-message :deep(em) {
  font-style: italic;
  color: var(--color-text-secondary, #555);
}

.formatted-message :deep(code) {
  background: var(--color-background, #f5f5f5);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #d63384;
}

.formatted-message :deep(ul),
.formatted-message :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.formatted-message :deep(li) {
  margin: 0.25rem 0;
}

.formatted-message :deep(br) {
  display: block;
  content: '';
}

.formatted-message :deep(a.oracle-link) {
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-primary, #3b82f6);
  transition: all 0.2s ease;
  padding-bottom: 1px;
}

.formatted-message :deep(a.oracle-link:hover) {
  color: var(--color-primary-dark, #1e40af);
  border-bottom-color: var(--color-primary-dark, #1e40af);
}

.formatted-message :deep(a.oracle-link span) {
  white-space: normal;
}

/* External link icon styles */
.formatted-message :deep(external-link)::after {
  content: '↗';
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-left: 0.25rem;
  font-size: 0.85em;
  vertical-align: -0.125em;
  opacity: 0.8;
}

.has-links :deep(a.oracle-link:hover external-link)::after {
  opacity: 1;
}

/* Responsive text wrapping */
@media (max-width: 640px) {
  .formatted-message {
    font-size: 0.95rem;
  }

  .formatted-message :deep(h1) {
    font-size: 1.25rem;
  }

  .formatted-message :deep(h2) {
    font-size: 1.1rem;
  }

  .formatted-message :deep(h3) {
    font-size: 1rem;
  }
}
</style>
