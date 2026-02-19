<template>
  <div class="paypal-payment">
    <div
      v-if="loading"
      class="paypal-payment__loading"
    >
      <p>{{ $t('paypal.payment.redirecting') }}</p>
    </div>
    <div
      v-else-if="error"
      class="paypal-payment__error"
    >
      <p>{{ error }}</p>
      <button
        class="btn btn-primary"
        @click="createAndRedirect"
      >
        {{ $t('paypal.payment.retry') }}
      </button>
    </div>
    <div
      v-else-if="!invoiceId"
      class="paypal-payment__no-invoice"
    >
      <p>{{ $t('paypal.payment.noInvoice') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePaymentRedirect } from 'vbwd-view-component';
import { api } from '@/api';

const { loading, error, invoiceId, readInvoiceFromQuery, createAndRedirect } =
  usePaymentRedirect('/plugins/paypal', api);

onMounted(() => {
  readInvoiceFromQuery();
  if (invoiceId.value) {
    createAndRedirect();
  }
});
</script>
