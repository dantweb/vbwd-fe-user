<template>
  <div class="yookassa-payment">
    <div
      v-if="loading"
      class="yookassa-payment__loading"
    >
      <p>{{ $t('yookassa.payment.redirecting') }}</p>
    </div>
    <div
      v-else-if="error"
      class="yookassa-payment__error"
    >
      <p>{{ error }}</p>
      <button
        class="btn btn-primary"
        @click="createAndRedirect"
      >
        {{ $t('yookassa.payment.retry') }}
      </button>
    </div>
    <div
      v-else-if="!invoiceId"
      class="yookassa-payment__no-invoice"
    >
      <p>{{ $t('yookassa.payment.noInvoice') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePaymentRedirect } from '@dantweb/view-component';
import { api } from '@/api';

const { loading, error, invoiceId, readInvoiceFromQuery, createAndRedirect } =
  usePaymentRedirect('/plugins/yookassa', api);

onMounted(() => {
  readInvoiceFromQuery();
  if (invoiceId.value) {
    createAndRedirect();
  }
});
</script>
