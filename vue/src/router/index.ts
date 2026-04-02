import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { isAuthenticated, sessionExpired } from '../api';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/taro',
    name: 'taro',
    component: () => import('@plugins/taro/src/Taro.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/tokens',
    name: 'tokens',
    component: () => import('../views/Tokens.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/tokens/:bundleId',
    name: 'token-bundle-detail',
    component: () => import('../views/TokenBundleDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/subscription/invoices',
    name: 'invoices',
    component: () => import('../views/Invoices.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/invoice/:invoiceId',
    name: 'invoice-detail',
    component: () => import('../views/InvoiceDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/invoice/:invoiceId/pay',
    name: 'invoice-pay',
    component: () => import('../views/InvoicePay.vue'),
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authenticated = isAuthenticated();

  // If session has expired, redirect to login
  if (sessionExpired.value && to.name !== 'login') {
    next({ name: 'login' });
    return;
  }

  if (to.meta.requiresAuth && !authenticated) {
    // Pass the intended destination as query param for redirect after login
    next({
      name: 'login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined
    });
  } else if (to.name === 'login' && authenticated) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
