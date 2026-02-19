<template>
  <div class="stripe-payment">
    <div
      v-if="loading"
      class="stripe-payment__loading"
    >
      <p>{{ $t('stripe.payment.redirecting') }}</p>
    </div>
    <div
      v-else-if="error"
      class="stripe-payment__error"
    >
      <p>{{ error }}</p>
      <button
        class="btn btn-primary"
        @click="createAndRedirect"
      >
        {{ $t('stripe.payment.retry') }}
      </button>
    </div>
    <div
      v-else-if="!invoiceId"
      class="stripe-payment__no-invoice"
    >
      <p>{{ $t('stripe.payment.noInvoice') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePaymentRedirect } from '@vbwd/view-component';
import { api } from '@/api';

const { loading, error, invoiceId, readInvoiceFromQuery, createAndRedirect } =
  usePaymentRedirect('/plugins/stripe', api);

onMounted(() => {
  readInvoiceFromQuery();
  if (invoiceId.value) {
    createAndRedirect();
  }
});
</script>
