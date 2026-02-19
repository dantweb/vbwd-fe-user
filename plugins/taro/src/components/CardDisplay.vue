<template>
  <div
    class="card-display"
    :class="[
      `position-${card.position.toLowerCase()}`,
      `orientation-${card.orientation.toLowerCase()}`,
      { 'is-closed': !isOpened, 'is-opened': isOpened }
    ]"
    :title="cardTitle"
    data-testid="card-display"
    @click="handleCardClick"
  >
    <!-- Card Back (Closed State) -->
    <div
      v-if="!isOpened"
      class="card-back"
    >
      <div class="card-back-visual">
        <div class="mystical-pattern" />
        <span class="reveal-hint">{{ $t('oracle.cardClickHint') }}</span>
      </div>
    </div>

    <!-- Card Front (Opened State) -->
    <template v-else>
      <!-- Card Visual -->
      <div
        class="card-visual"
        :class="{ reversed: card.orientation === 'REVERSED' }"
      >
        <!-- Card Image (if available) -->
        <div
          v-if="hasCardImage"
          class="card-image-container"
        >
          <img
            :src="cardImageUrl"
            :alt="cardImageAlt"
            class="card-image"
            :title="cardImageAlt"
          >
        </div>

        <!-- Placeholder (fallback if no image) -->
        <div
          v-else
          class="card-placeholder"
        >
          <svg
            width="80"
            height="120"
            viewBox="0 0 80 120"
            fill="none"
            stroke="currentColor"
          >
            <rect
              x="2"
              y="2"
              width="76"
              height="116"
              rx="4"
              stroke-width="1.5"
            />
            <path
              d="M 40 30 L 50 50 L 30 50 Z"
              stroke-width="1.5"
            />
            <circle
              cx="40"
              cy="75"
              r="15"
              stroke-width="1.5"
            />
          </svg>
          <div class="position-label">
            {{ card.position }}
          </div>
        </div>
      </div>

      <!-- Card Info -->
      <div class="card-info">
        <div class="card-position">
          {{ $t(`taro.position.${card.position.toLowerCase()}`) }}
        </div>
        <div
          class="card-orientation"
          :class="{ reversed: card.orientation === 'REVERSED' }"
        >
          {{ $t(`taro.orientation.${card.orientation.toLowerCase()}`) }}
        </div>

        <!-- Interpretation (if available) -->
        <div
          v-if="cardInterpretation"
          class="card-interpretation"
        >
          {{ cardInterpretation }}
        </div>

        <!-- Loading Interpretation -->
        <div
          v-else
          class="interpretation-loading"
        >
          <span class="text-secondary">{{ $t('taro.loadingInterpretation') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TaroCard } from '@/stores';
import { computed } from 'vue';

interface Props {
  card: TaroCard;
  isOpened?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpened: false,
});

const emit = defineEmits<{
  'card-click': [cardId: string];
  'card-fullscreen': [cardId: string];
}>();

/**
 * Handle card click - open if closed, show fullscreen if already opened
 */
function handleCardClick() {
  if (!props.isOpened) {
    emit('card-click', props.card.card_id);
  } else {
    emit('card-fullscreen', props.card.card_id);
  }
}

const cardTitle = computed(() => {
  const position = `taro.position.${props.card.position.toLowerCase()}`;
  const orientation = `taro.orientation.${props.card.orientation.toLowerCase()}`;
  return `${position} - ${orientation}`;
});

/**
 * Check if card has an image available from the arcana data
 */
const hasCardImage = computed(() => {
  return props.card.arcana?.image_url && isValidImageUrl(props.card.arcana.image_url);
});

/**
 * Get the card image URL (supports SVG, PNG, JPEG, and future formats)
 */
const cardImageUrl = computed(() => {
  return props.card.arcana?.image_url || '';
});

/**
 * Get alt text for the card image
 */
const cardImageAlt = computed(() => {
  if (props.card.arcana?.name) {
    return `${props.card.arcana.name} (${props.card.position} - ${props.card.orientation})`;
  }
  return `${props.card.position} - ${props.card.orientation}`;
});

/**
 * Get card interpretation (supports both ai_interpretation and interpretation fields)
 */
const cardInterpretation = computed(() => {
  return props.card.ai_interpretation || props.card.interpretation;
});

/**
 * Check if URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  // Accept HTTP/HTTPS URLs and relative paths
  return url.startsWith('http://') ||
         url.startsWith('https://') ||
         url.startsWith('/') ||
         url.startsWith('./');
}
</script>

<style scoped>
.card-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  background: var(--color-background);
}

/* Closed state: card back, dimmed, clickable */
.card-display.is-closed {
  cursor: pointer;
  opacity: 0.7;
}

.card-display.is-closed:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.1);
  transform: translateY(-4px);
  opacity: 0.85;
}

/* Opened state: card front, full opacity, clickable to view fullscreen */
.card-display.is-opened {
  cursor: pointer;
  opacity: 1;
  pointer-events: auto;
}

.card-display.is-opened:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.05);
  transform: translateY(-2px);
}

.card-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 140px;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  position: relative;
}

.card-back-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.mystical-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
  z-index: 0;
}

.reveal-hint {
  color: var(--color-text-inverted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.card-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
  background: linear-gradient(135deg, var(--color-background-secondary) 0%, var(--color-background) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.card-visual.reversed {
  transform: rotate(180deg);
}

.card-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--spacing-xs);
}

.card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
}

.card-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.card-placeholder svg {
  color: var(--color-primary);
  opacity: 0.7;
}

.position-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-primary);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.card-position {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  text-transform: capitalize;
}

.card-orientation {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.card-orientation.reversed {
  color: var(--color-warning);
  font-weight: 500;
}

.card-interpretation {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: var(--spacing-xs);
}

.interpretation-loading {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.text-secondary {
  opacity: 0.7;
}

/* Position-specific styling */
.position-past .card-placeholder svg {
  opacity: 0.5;
}

.position-present .card-placeholder svg {
  opacity: 0.9;
}

.position-future .card-placeholder svg {
  opacity: 0.7;
  color: var(--color-success);
}

/* Responsive */
@media (max-width: 640px) {
  .card-display {
    padding: var(--spacing-xs);
  }

  .card-visual {
    height: 120px;
  }

  .card-placeholder svg {
    width: 60px;
    height: 90px;
  }
}
</style>
