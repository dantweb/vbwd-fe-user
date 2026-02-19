<template>
  <div class="stripe-cancel">
    <h2>{{ $t('stripe.cancel.title') }}</h2>
    <p>{{ $t('stripe.cancel.message') }}</p>
    <router-link
      to="/checkout"
      class="btn btn-primary"
    >
      {{ $t('stripe.cancel.tryAgain') }}
    </router-link>
  </div>
</template>
