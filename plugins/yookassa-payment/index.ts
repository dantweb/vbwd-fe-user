import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import zh from './locales/zh.json';

export const yookassaPaymentPlugin: IPlugin = {
  name: 'yookassa-payment',
  version: '1.0.0',
  description: 'YooKassa payment processing — redirects to YooKassa Checkout',
  _active: false,

  install(sdk: IPlatformSDK) {
    sdk.addRoute({
      path: '/pay/yookassa',
      name: 'yookassa-payment',
      component: () => import('./YooKassaPaymentView.vue'),
      meta: { requiresAuth: true }
    });
    sdk.addRoute({
      path: '/pay/yookassa/success',
      name: 'yookassa-success',
      component: () => import('./YooKassaSuccessView.vue'),
      meta: { requiresAuth: true }
    });
    sdk.addRoute({
      path: '/pay/yookassa/cancel',
      name: 'yookassa-cancel',
      component: () => import('./YooKassaCancelView.vue'),
      meta: { requiresAuth: true }
    });

    sdk.addTranslations('en', en);
    sdk.addTranslations('de', de);
    sdk.addTranslations('es', es);
    sdk.addTranslations('fr', fr);
    sdk.addTranslations('ja', ja);
    sdk.addTranslations('ru', ru);
    sdk.addTranslations('th', th);
    sdk.addTranslations('zh', zh);
  },

  activate() { this._active = true; },
  deactivate() { this._active = false; }
};
