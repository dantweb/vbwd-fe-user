<template>
  <div class="cards-grid">
    <CardDisplay
      v-for="card in cards"
      :key="card.card_id"
      :card="card"
      :is-opened="openedCardIds.has(card.card_id)"
      @card-click="$emit('card-click', $event)"
      @card-fullscreen="$emit('card-fullscreen', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { TaroCard } from '@/stores';
import CardDisplay from './CardDisplay.vue';

interface Props {
  cards?: TaroCard[];
  openedCardIds: Set<string>;
}

withDefaults(defineProps<Props>(), {
  cards: () => [],
});

defineEmits<{
  'card-click': [cardId: string];
  'card-fullscreen': [cardId: string];
}>();
</script>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>
