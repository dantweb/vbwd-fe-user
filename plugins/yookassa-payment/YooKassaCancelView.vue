<template>
  <div class="yookassa-cancel">
    <h2>{{ $t('yookassa.cancel.title') }}</h2>
    <p>{{ $t('yookassa.cancel.message') }}</p>
    <router-link
      to="/checkout"
      class="btn btn-primary"
    >
      {{ $t('yookassa.cancel.tryAgain') }}
    </router-link>
  </div>
</template>
