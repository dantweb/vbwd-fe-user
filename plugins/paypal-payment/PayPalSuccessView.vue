<template>
  <div class="paypal-success">
    <div
      v-if="capturing"
      class="paypal-success__verifying"
    >
      <p>{{ $t('paypal.success.verifying') }}</p>
    </div>
    <div
      v-else-if="confirmed"
      class="paypal-success__confirmed"
    >
      <h2>{{ $t('paypal.success.title') }}</h2>
      <p>{{ $t('paypal.success.message') }}</p>
      <router-link
        to="/dashboard/invoices"
        class="btn btn-primary"
      >
        {{ $t('paypal.success.viewInvoices') }}
      </router-link>
    </div>
    <div
      v-else-if="timedOut"
      class="paypal-success__processing"
    >
      <p>{{ $t('paypal.success.processing') }}</p>
    </div>
    <div
      v-else-if="error"
      class="paypal-success__error"
    >
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const capturing = ref(true);
const confirmed = ref(false);
const timedOut = ref(false);
const error = ref<string | null>(null);

async function captureAndVerify(): Promise<void> {
  // PayPal returns ?token=ORDER_ID for one-time, ?subscription_id=I-SUB for subscriptions
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('token');
  const subscriptionId = params.get('subscription_id');

  if (subscriptionId) {
    // Subscription was activated via webhook — just show success
    capturing.value = false;
    confirmed.value = true;
    return;
  }

  if (!orderId) {
    capturing.value = false;
    error.value = 'No order token found';
    return;
  }

  try {
    await api.post('/plugins/paypal/capture-order', { order_id: orderId });
    capturing.value = false;
    confirmed.value = true;
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } }; message?: string };
    const msg = err?.response?.data?.error || err?.message || '';
    // If capture already completed (idempotent), treat as success
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('completed')) {
      capturing.value = false;
      confirmed.value = true;
    } else {
      capturing.value = false;
      error.value = msg || 'Payment capture failed';
    }
  }
}

onMounted(() => {
  captureAndVerify();
});
</script>
