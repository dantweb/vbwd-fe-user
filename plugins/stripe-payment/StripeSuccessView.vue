<template>
  <div class="stripe-success">
    <div
      v-if="polling"
      class="stripe-success__verifying"
    >
      <p>{{ $t('stripe.success.verifying') }}</p>
    </div>
    <div
      v-else-if="confirmed"
      class="stripe-success__confirmed"
    >
      <h2>{{ $t('stripe.success.title') }}</h2>
      <p>{{ $t('stripe.success.message') }}</p>
      <router-link
        to="/dashboard/invoices"
        class="btn btn-primary"
      >
        {{ $t('stripe.success.viewInvoices') }}
      </router-link>
    </div>
    <div
      v-else-if="timedOut"
      class="stripe-success__processing"
    >
      <p>{{ $t('stripe.success.processing') }}</p>
    </div>
    <div
      v-else-if="error"
      class="stripe-success__error"
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
  usePaymentStatus('/plugins/stripe', api);

onMounted(() => {
  readSessionFromQuery();
  startPolling();
});
</script>
