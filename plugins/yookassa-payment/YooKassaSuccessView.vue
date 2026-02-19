<template>
  <div class="yookassa-success">
    <div
      v-if="polling"
      class="yookassa-success__verifying"
    >
      <p>{{ $t('yookassa.success.verifying') }}</p>
    </div>
    <div
      v-else-if="confirmed"
      class="yookassa-success__confirmed"
    >
      <h2>{{ $t('yookassa.success.title') }}</h2>
      <p>{{ $t('yookassa.success.message') }}</p>
      <router-link
        to="/dashboard/invoices"
        class="btn btn-primary"
      >
        {{ $t('yookassa.success.viewInvoices') }}
      </router-link>
    </div>
    <div
      v-else-if="timedOut"
      class="yookassa-success__processing"
    >
      <p>{{ $t('yookassa.success.processing') }}</p>
    </div>
    <div
      v-else-if="error"
      class="yookassa-success__error"
    >
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePaymentStatus } from '@dantweb/view-component';
import { api } from '@/api';

const { polling, confirmed, timedOut, error, readSessionFromQuery, startPolling } =
  usePaymentStatus('/plugins/yookassa', api);

onMounted(() => {
  readSessionFromQuery();
  startPolling();
});
</script>
