<template>
  <div
    class="modal-overlay"
    :class="{ 'fullscreen-mode': props.fullscreen }"
    data-testid="card-detail-modal"
    @click.self="$emit('close')"
  >
    <div class="modal-content" :class="{ 'fullscreen-mode': props.fullscreen }">
      <button
        class="modal-close"
        :title="$t('common.close')"
        @click="$emit('close')"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
            stroke-width="2"
          />
          <line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
            stroke-width="2"
          />
        </svg>
      </button>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="error-state"
      >
        <p>{{ $t('common.error') }}: {{ error }}</p>
        <button
          class="btn btn-primary"
          @click="$emit('close')"
        >
          {{ $t('common.close') }}
        </button>
      </div>

      <!-- Card Details (Fullscreen Mode) -->
      <div
        v-if="props.fullscreen && cardData"
        class="card-details fullscreen"
      >
        <div class="card-visual large">
          <!-- Card Image -->
          <img
            v-if="cardData?.arcana?.image_url"
            :src="cardData.arcana.image_url"
            :alt="cardData.arcana.name"
            class="card-image"
          >
          <!-- Fallback placeholder if no image -->
          <svg
            v-else
            width="100"
            height="150"
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
        </div>
      </div>

      <!-- Card Details (Normal Mode) -->
      <div
        v-else-if="!props.fullscreen && cardData"
        class="card-details"
      >
        <!-- Visual Section -->
        <div class="visual-section">
          <div
            class="card-visual"
            :class="{ reversed: cardData?.orientation === 'REVERSED' }"
          >
            <!-- Card Image -->
            <img
              v-if="cardData?.arcana?.image_url"
              :src="cardData.arcana.image_url"
              :alt="cardData.arcana.name"
              class="card-image"
            >
            <!-- Fallback placeholder if no image -->
            <svg
              v-else
              width="140"
              height="200"
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
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <h2>{{ cardData?.arcana?.name || cardData?.position }}</h2>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ $t('taro.position.label') }}</span>
              <span class="info-value">
                {{ $t(`taro.position.${cardData?.position.toLowerCase()}`) }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('taro.orientation.label') }}</span>
              <span
                class="info-value"
                :class="{ 'text-warning': cardData?.orientation === 'REVERSED' }"
              >
                {{ $t(`taro.orientation.${cardData?.orientation.toLowerCase()}`) }}
              </span>
            </div>
          </div>

          <!-- Card Meaning -->
          <div class="meaning-section">
            <h3>{{ $t('taro.card.meaning') }}</h3>
            <p class="meaning-text">
              {{
                cardData?.orientation === 'REVERSED'
                  ? cardData?.arcana?.reversed_meaning
                  : cardData?.arcana?.upright_meaning
              }}
            </p>
          </div>

          <!-- AI Interpretation -->
          <div class="interpretation-section">
            <h3>{{ $t('taro.interpretation') }}</h3>
            <p
              v-if="cardData?.interpretation"
              class="interpretation-text"
            >
              {{ cardData.interpretation }}
            </p>
            <p
              v-else
              class="interpretation-loading"
            >
              {{ $t('taro.interpretationNotYetGenerated') }}
            </p>
          </div>

          <!-- Metadata (Hidden) -->
          <div
            class="metadata"
            style="display: none;"
          >
            <input
              :value="cardData?.card_id"
              type="hidden"
              aria-label="Card ID"
            >
            <input
              :value="cardData?.arcana_id"
              type="hidden"
              aria-label="Arcana ID"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { TaroCard } from '@/stores';
import { useTaroStore } from '@/stores';

interface Props {
  cardId: string;
  fullscreen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
});

defineEmits<{
  close: [];
}>();

const taroStore = useTaroStore();
const cardData = ref<TaroCard | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  // Find card in current session
  if (taroStore.currentSession?.cards) {
    const found = taroStore.currentSession.cards.find((c) => c.card_id === props.cardId);
    if (found) {
      cardData.value = found;
      return;
    }
  }

  // Find in history
  for (const session of taroStore.sessionHistory) {
    if (session.cards) {
      const found = session.cards.find((c) => c.card_id === props.cardId);
      if (found) {
        cardData.value = found;
        return;
      }
    }
  }

  error.value = 'Card not found';
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.modal-overlay.fullscreen-mode {
  background-color: rgba(0, 0, 0, 0.8);
  padding: var(--spacing-lg);
}

.modal-content {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.modal-content.fullscreen-mode {
  background: transparent;
  box-shadow: none;
  max-width: 100%;
  max-height: 90vh;
  width: 100%;
  height: 90vh;
  grid-template-columns: 1fr;
  gap: 0;
  padding: 0;
  border-radius: 0;
  overflow: hidden;
}

.modal-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  z-index: 10;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-content.fullscreen-mode .modal-close {
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  padding: 12px;
}

.modal-content.fullscreen-mode .modal-close:hover {
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

/* Loading State */
.loading-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  color: var(--color-text-secondary);
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  grid-column: 1 / -1;
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-lg);
  color: var(--color-error-dark);
  text-align: center;
}

.error-state p {
  margin-bottom: var(--spacing-md);
}

/* Card Details */
.card-details {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.visual-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 240px;
  background: linear-gradient(135deg, var(--color-background-secondary) 0%, var(--color-background) 100%);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  color: var(--color-primary);
}

.card-visual.large {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  color: inherit;
}

.card-visual.reversed {
  transform: rotate(180deg);
}

.card-visual.large.reversed {
  transform: rotate(180deg);
}

.card-visual svg {
  opacity: 0.8;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-visual.large .card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.info-section h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  font-weight: 500;
  text-transform: capitalize;
}

.info-value.text-warning {
  color: var(--color-warning);
}

/* Meaning Section */
.meaning-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.meaning-section h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meaning-text {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}

/* Interpretation Section */
.interpretation-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.interpretation-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.interpretation-text {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.interpretation-loading {
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
}

/* Metadata */
.metadata {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.metadata-label {
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.metadata-value {
  background: var(--color-background);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--color-primary);
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

/* Buttons */
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

/* Card Details Fullscreen */
.card-details.fullscreen {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  gap: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    grid-template-columns: 1fr;
    padding: var(--spacing-md);
  }

  .card-details {
    grid-template-columns: 1fr;
  }

  .modal-close {
    top: var(--spacing-xs);
    right: var(--spacing-xs);
  }

  .modal-content.fullscreen-mode {
    max-height: 95vh;
    height: 95vh;
  }

  .modal-content.fullscreen-mode .modal-close {
    top: var(--spacing-md);
    right: var(--spacing-md);
    padding: 10px;
  }
}
</style>
