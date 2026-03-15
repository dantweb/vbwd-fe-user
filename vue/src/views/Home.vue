<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api, isAuthenticated } from '@/api';

const router = useRouter();

onMounted(async () => {
  try {
    const rules: Array<{
      match_type: string;
      target_slug: string;
      is_active: boolean;
      layer: string;
    }> = await api.get('/cms/routing-rules/middleware');

    const defaultRule = rules.find(r => r.is_active && r.match_type === 'default');
    if (defaultRule) {
      const slug = defaultRule.target_slug.startsWith('/')
        ? defaultRule.target_slug
        : `/${defaultRule.target_slug}`;
      await router.replace(slug);
      return;
    }
  } catch {
    // fall through to default behaviour
  }

  // No routing rule configured — fall back to app defaults
  if (isAuthenticated()) {
    router.replace('/dashboard');
  } else {
    router.replace('/login');
  }
});
</script>
