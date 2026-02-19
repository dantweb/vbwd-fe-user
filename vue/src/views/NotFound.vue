<template>
  <div class="not-found">
    <h1>404</h1>
    <p>{{ $t('notFound.message') }}</p>
    <router-link
      to="/dashboard"
      class="back-link"
    >
      {{ $t('notFound.backHome') }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.not-found h1 {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  color: #6b7280;
}
.not-found p {
  font-size: 1.25rem;
  color: #9ca3af;
  margin-bottom: 1.5rem;
}
.back-link {
  color: #3b82f6;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
</style>
