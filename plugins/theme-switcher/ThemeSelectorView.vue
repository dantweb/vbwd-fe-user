<template>
  <div
    class="theme-selector"
    data-testid="theme-selector"
  >
    <h2>{{ $t('theme.title') }}</h2>
    <p class="theme-subtitle">
      {{ $t('theme.subtitle') }}
    </p>

    <div class="theme-grid">
      <div
        v-for="preset in presets"
        :key="preset.id"
        class="theme-card"
        :class="{ 'theme-card--active': currentTheme === preset.id }"
        :data-testid="`theme-${preset.id}`"
        @click="selectTheme(preset.id)"
      >
        <div class="theme-preview">
          <div
            class="preview-sidebar"
            :style="{ backgroundColor: preset.preview.sidebar }"
          />
          <div
            class="preview-content"
            :style="{ backgroundColor: preset.preview.background }"
          >
            <div
              class="preview-card"
              :style="{ backgroundColor: preset.preview.card }"
            >
              <div
                class="preview-heading"
                :style="{ backgroundColor: preset.preview.primary }"
              />
              <div
                class="preview-text"
                :style="{ backgroundColor: preset.preview.text }"
              />
              <div
                class="preview-text short"
                :style="{ backgroundColor: preset.preview.text }"
              />
            </div>
          </div>
        </div>

        <div class="theme-info">
          <span class="theme-name">{{ $t(preset.name) }}</span>
          <span
            v-if="currentTheme === preset.id"
            class="theme-active-badge"
          >
            {{ $t('theme.active') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { themePresets } from './presets';
import { applyTheme } from './apply-theme';

const STORAGE_KEY = 'vbwd_theme';
const presets = themePresets;
const currentTheme = ref(localStorage.getItem(STORAGE_KEY) || 'default');

function selectTheme(themeId: string) {
  const preset = presets.find(p => p.id === themeId);
  if (!preset) return;

  applyTheme(preset);
  localStorage.setItem(STORAGE_KEY, themeId);
  currentTheme.value = themeId;
}
</script>

<style scoped>
.theme-selector {
  max-width: 900px;
}

.theme-selector h2 {
  margin-bottom: 8px;
  color: var(--vbwd-text-heading, #2c3e50);
}

.theme-subtitle {
  color: var(--vbwd-text-muted, #666);
  margin-bottom: 24px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.theme-card {
  border: 2px solid var(--vbwd-border-color, #ddd);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--vbwd-card-bg, #ffffff);
}

.theme-card:hover {
  border-color: var(--vbwd-color-primary, #3498db);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-card--active {
  border-color: var(--vbwd-color-primary, #3498db);
}

.theme-preview {
  display: flex;
  height: 120px;
}

.preview-sidebar {
  width: 30%;
}

.preview-content {
  width: 70%;
  padding: 8px;
  display: flex;
  align-items: flex-start;
}

.preview-card {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
}

.preview-heading {
  height: 6px;
  width: 50%;
  border-radius: 3px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.preview-text {
  height: 4px;
  width: 80%;
  border-radius: 2px;
  margin-bottom: 3px;
  opacity: 0.3;
}

.preview-text.short {
  width: 50%;
}

.theme-info {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-name {
  font-weight: 500;
  color: var(--vbwd-text-body, #333);
}

.theme-active-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--vbwd-color-primary, #3498db);
  color: white;
  border-radius: 12px;
}
</style>
