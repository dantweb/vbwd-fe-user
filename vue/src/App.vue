<template>
  <div id="app">
    <!-- Embed routes: no layout, no session modal -->
    <router-view v-if="isEmbedRoute" />

    <!-- Authenticated routes: full layout -->
    <UserLayout v-else-if="isAuthenticated">
      <router-view />
    </UserLayout>

    <!-- Public routes: no layout -->
    <router-view v-else />

    <!-- Session Expired Modal (hidden in embed mode) -->
    <SessionExpiredModal v-if="!isEmbedRoute" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UserLayout from './layouts/UserLayout.vue';
import SessionExpiredModal from './components/SessionExpiredModal.vue';

const route = useRoute();

const isEmbedRoute = computed(() => route.meta.embed === true);

const isAuthenticated = computed(() => {
  return route.meta.requiresAuth !== false && localStorage.getItem('auth_token');
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--vbwd-page-bg, #f5f5f5);
  color: var(--vbwd-text-body, #333);
}

#app {
  min-height: 100vh;
}
</style>
