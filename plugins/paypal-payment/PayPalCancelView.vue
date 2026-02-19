<template>
  <div class="paypal-cancel">
    <h2>{{ $t('paypal.cancel.title') }}</h2>
    <p>{{ $t('paypal.cancel.message') }}</p>
    <router-link
      to="/checkout"
      class="btn btn-primary"
    >
      {{ $t('paypal.cancel.tryAgain') }}
    </router-link>
  </div>
</template>
