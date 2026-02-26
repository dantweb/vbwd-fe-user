<template>
  <div class="dashboard">
    <h1>{{ $t('dashboard.title') }}</h1>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
      data-testid="dashboard-loading"
    >
      <div class="spinner" />
      <p>{{ $t('dashboard.loading') }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
      data-testid="dashboard-error"
    >
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="loadDashboardData"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Dashboard Content -->
    <div
      v-else
      class="dashboard-grid"
    >
      <!-- Profile Summary Card -->
      <div
        class="card profile-card"
        data-testid="profile-summary"
      >
        <h3>{{ $t('dashboard.profileCard.title') }}</h3>
        <div class="profile-info">
          <div class="avatar">
            {{ userInitials }}
          </div>
          <div class="profile-details">
            <span
              class="user-name"
              data-testid="user-name"
            >{{ userName }}</span>
            <span
              class="user-email"
              data-testid="user-email"
            >{{ userEmail }}</span>
            <span
              class="user-status"
              :class="userStatus"
              data-testid="user-status"
            >
              {{ userStatus }}
            </span>
          </div>
        </div>
        <router-link
          to="/dashboard/profile"
          class="card-link"
        >
          {{ $t('dashboard.profileCard.viewProfile') }} →
        </router-link>
      </div>

      <!-- Subscription Card -->
      <div
        class="card subscription-card"
        data-testid="subscription-summary"
      >
        <h3>{{ $t('dashboard.subscriptionCard.title') }}</h3>

        <!-- No active subscriptions -->
        <div
          v-if="activeSubscriptions.length === 0"
          class="no-subscription"
        >
          <p>{{ $t('dashboard.subscriptionCard.noActiveSubscription') }}</p>
          <router-link
            to="/dashboard/plans"
            class="btn primary"
          >
            {{ $t('common.browsePlans') }}
          </router-link>
        </div>

        <!-- Primary (is_single) subscription -->
        <div
          v-if="primarySubscription"
          class="subscription-info"
        >
          <div class="plan-header">
            <span
              class="plan-name"
              data-testid="plan-name"
            >{{ primarySubscription.plan?.name || $t('dashboard.subscriptionCard.noPlan') }}</span>
            <span
              class="plan-status"
              :class="primarySubscription.status.toLowerCase()"
              data-testid="subscription-status"
            >
              {{ formatStatus(primarySubscription.status) }}
            </span>
          </div>
          <div class="subscription-details">
            <div class="detail-item">
              <span class="label">{{ $t('dashboard.subscriptionCard.billingPeriod') }}</span>
              <span class="value">{{ primarySubscription.plan?.billing_period || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">{{ $t('dashboard.subscriptionCard.nextBilling') }}</span>
              <span class="value">{{ formatDate(primarySubscription.expires_at) }}</span>
            </div>
            <div
              class="detail-item token-balance"
              data-testid="token-balance"
            >
              <span class="label">{{ $t('dashboard.subscriptionCard.tokenBalance') }}</span>
              <span class="value highlight">{{ formatNumber(tokenBalance) }} {{ $t('common.tokenUnit') }}</span>
            </div>
          </div>
        </div>

        <!-- Additional multi-subscriptions (is_single=false categories) -->
        <div
          v-if="multiSubscriptions.length > 0"
          class="multi-subs"
        >
          <h4>{{ $t('dashboard.subscriptionCard.additionalSubscriptions') }}</h4>
          <div
            v-for="sub in multiSubscriptions"
            :key="sub.id"
            class="multi-sub-item"
            data-testid="multi-sub-item"
          >
            <span class="multi-sub-name">{{ sub.plan?.name || $t('dashboard.subscriptionCard.noPlan') }}</span>
            <span
              class="plan-status"
              :class="sub.status.toLowerCase()"
            >{{ formatStatus(sub.status) }}</span>
          </div>
        </div>

        <router-link
          v-if="activeSubscriptions.length > 0"
          to="/dashboard/subscription"
          class="card-link"
        >
          {{ $t('dashboard.subscriptionCard.manageSubscription') }} →
        </router-link>
      </div>

      <!-- Subscription History Card -->
      <div
        class="card history-card"
        data-testid="subscription-history"
      >
        <h3>{{ $t('dashboard.historyCard.title') }}</h3>
        <div
          v-if="subscriptionHistory.length > 0"
          class="history-list"
        >
          <div
            v-for="sub in subscriptionHistory"
            :key="sub.id"
            class="history-item"
            data-testid="history-item"
          >
            <div class="history-info">
              <span class="history-plan">{{ sub.plan?.name || 'Unknown Plan' }}</span>
              <span class="history-dates">
                {{ formatDate(sub.started_at) }} — {{ sub.cancelled_at ? formatDate(sub.cancelled_at) : $t('common.present') }}
              </span>
            </div>
            <span
              class="history-status"
              :class="sub.status.toLowerCase()"
              data-testid="history-status"
            >
              {{ formatStatus(sub.status) }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="empty-state"
        >
          <p>{{ $t('dashboard.historyCard.noHistory') }}</p>
        </div>
      </div>

      <!-- Add-ons Card -->
      <div
        class="card addons-card"
        data-testid="user-addons"
      >
        <h3>{{ $t('dashboard.addonsCard.title') }}</h3>
        <div v-if="activeAddons.length > 0 || inactiveAddons.length > 0">
          <div
            v-if="activeAddons.length > 0"
            class="addons-section"
          >
            <h4>{{ $t('dashboard.addonsCard.active') }}</h4>
            <router-link
              v-for="addon in activeAddons"
              :key="addon.id"
              :to="`/dashboard/add-ons/${addon.id}`"
              class="addon-item addon-item-link"
              data-testid="addon-item"
            >
              <span class="addon-name">{{ addon.addon?.name || 'Add-on' }}</span>
              <span class="addon-status active">{{ formatStatus(addon.status) }}</span>
            </router-link>
          </div>
          <div
            v-if="inactiveAddons.length > 0"
            class="addons-section"
          >
            <h4>{{ $t('dashboard.addonsCard.expired') }}</h4>
            <router-link
              v-for="addon in inactiveAddons"
              :key="addon.id"
              :to="`/dashboard/add-ons/${addon.id}`"
              class="addon-item addon-item-link"
              data-testid="addon-item-inactive"
            >
              <span class="addon-name">{{ addon.addon?.name || 'Add-on' }}</span>
              <span
                class="addon-status"
                :class="addon.status.toLowerCase()"
              >{{ formatStatus(addon.status) }}</span>
            </router-link>
          </div>
        </div>
        <div
          v-else
          class="empty-state"
        >
          <p>{{ $t('dashboard.addonsCard.noAddons') }}</p>
        </div>
        <router-link
          to="/dashboard/add-ons"
          class="card-link"
        >
          {{ $t('dashboard.addonsCard.browseAddons') }} →
        </router-link>
      </div>

      <!-- Token Top-up History Card -->
      <div
        class="card token-history-card"
        data-testid="token-history"
      >
        <h3>{{ $t('dashboard.tokenHistoryCard.title') }}</h3>
        <div
          v-if="tokenTransactions.length > 0"
          class="token-list"
        >
          <div
            v-for="tx in tokenTransactions"
            :key="tx.id"
            class="token-item"
            data-testid="token-item"
          >
            <div class="token-info">
              <span class="token-type">{{ formatTransactionType(tx.transaction_type) }}</span>
              <span class="token-date">{{ formatDate(tx.created_at) }}</span>
            </div>
            <span
              class="token-amount"
              :class="tx.amount > 0 ? 'credit' : 'debit'"
            >
              {{ tx.amount > 0 ? '+' : '' }}{{ formatNumber(tx.amount) }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="empty-state"
        >
          <p>{{ $t('dashboard.tokenHistoryCard.noActivity') }}</p>
        </div>
        <router-link
          to="/dashboard/tokens"
          class="card-link"
        >
          {{ $t('dashboard.tokenHistoryCard.purchaseTokens') }} →
        </router-link>
      </div>

      <!-- Recent Invoices Card -->
      <div
        class="card invoices-card"
        data-testid="recent-invoices"
      >
        <h3>{{ $t('dashboard.invoicesCard.title') }}</h3>
        <div
          v-if="recentInvoices.length > 0"
          class="invoices-list"
        >
          <router-link
            v-for="invoice in recentInvoices"
            :key="invoice.id"
            :to="`/dashboard/subscription/invoices/${invoice.id}`"
            class="invoice-item invoice-item-link"
            data-testid="invoice-item"
          >
            <div class="invoice-info">
              <span class="invoice-number">{{ invoice.invoice_number }}</span>
              <span class="invoice-date">{{ formatDate(invoice.invoiced_at) }}</span>
            </div>
            <div class="invoice-right">
              <span class="invoice-amount">{{ formatPrice(invoice.amount) }}</span>
              <span
                class="invoice-status"
                :class="invoice.status.toLowerCase()"
              >
                {{ invoice.status }}
              </span>
            </div>
          </router-link>
        </div>
        <div
          v-else
          class="no-invoices"
        >
          <p>{{ $t('dashboard.invoicesCard.noInvoices') }}</p>
        </div>
        <router-link
          to="/dashboard/subscription/invoices"
          class="card-link"
        >
          {{ $t('dashboard.invoicesCard.viewAllInvoices') }} →
        </router-link>
      </div>

      <!-- Quick Actions Card -->
      <div class="card actions-card full-width">
        <h3>{{ $t('dashboard.quickActions.title') }}</h3>
        <div class="actions">
          <router-link
            to="/dashboard/profile"
            class="action-btn"
          >
            {{ $t('dashboard.quickActions.editProfile') }}
          </router-link>
          <router-link
            to="/dashboard/subscription"
            class="action-btn"
          >
            {{ $t('dashboard.quickActions.manageSubscription') }}
          </router-link>
          <router-link
            to="/dashboard/plans"
            class="action-btn"
          >
            {{ $t('dashboard.quickActions.browsePlans') }}
          </router-link>
          <router-link
            to="/dashboard/subscription/invoices"
            class="action-btn"
          >
            {{ $t('dashboard.quickActions.viewInvoices') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProfileStore } from '../stores/profile';
import { useSubscriptionStore } from '../stores/subscription';
import type { TokenTransaction } from '../stores/subscription';
import { useInvoicesStore } from '../stores/invoices';
import { api } from '@/api';

const { t } = useI18n();
const profileStore = useProfileStore();
const subscriptionStore = useSubscriptionStore();
const invoicesStore = useInvoicesStore();

const loading = ref(true);
const error = ref<string | null>(null);

// Profile computed
const userName = computed(() => profileStore.profile?.name || 'User');
const userEmail = computed(() => profileStore.profile?.email || '');
const userStatus = computed(() => 'active'); // Could come from profile
const userInitials = computed(() => {
  const name = userName.value;
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

// Subscription computed
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions);

// Primary subscription: from an is_single=true category, or first in list
const primarySubscription = computed(() => {
  const subs = activeSubscriptions.value;
  return (
    subs.find(sub => sub.plan?.categories?.some(c => c.is_single)) ||
    subs[0] ||
    null
  );
});

// Multi subscriptions: everything except the primary
const multiSubscriptions = computed(() => {
  const primary = primarySubscription.value;
  return activeSubscriptions.value.filter(sub => sub.id !== primary?.id);
});

const subscriptionHistory = computed(() => subscriptionStore.history);
const activeAddons = computed(() => subscriptionStore.activeAddons);
const inactiveAddons = computed(() => subscriptionStore.inactiveAddons);
const tokenBalance = ref(0);
const tokenTransactions = ref<TokenTransaction[]>([]);

async function fetchTokenBalance(): Promise<void> {
  try {
    const response = await api.get('/user/tokens/balance') as { balance: number };
    tokenBalance.value = response.balance || 0;
  } catch {
    tokenBalance.value = 0;
  }
}

async function fetchTokenTransactions(): Promise<void> {
  try {
    const response = await api.get('/user/tokens/transactions?limit=10') as { transactions: TokenTransaction[] };
    tokenTransactions.value = response.transactions || [];
  } catch {
    tokenTransactions.value = [];
  }
}

// Invoices computed
const recentInvoices = computed(() => {
  return invoicesStore.invoices.slice(0, 5);
});

async function loadDashboardData(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    await Promise.all([
      profileStore.fetchProfile(),
      subscriptionStore.fetchSubscription().catch(() => null),
      subscriptionStore.fetchActiveSubscriptions().catch(() => null),
      subscriptionStore.fetchHistory().catch(() => null),
      subscriptionStore.fetchUserAddons().catch(() => null),
      invoicesStore.fetchInvoices().catch(() => null),
      fetchTokenBalance(),
      fetchTokenTransactions(),
    ]);
  } catch (err) {
    error.value = (err as Error).message || t('dashboard.errors.failedToLoad');
  } finally {
    loading.value = false;
  }
}

function formatStatus(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '-';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatTransactionType(type: string): string {
  const map: Record<string, string> = {
    purchase: 'Purchase',
    credit: 'Credit',
    refund: 'Refund',
    usage: 'Usage',
    bonus: 'Bonus',
  };
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

h1 {
  margin-bottom: 30px;
  color: var(--vbwd-text-heading, #2c3e50);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--vbwd-border-light, #f3f3f3);
  border-top: 3px solid var(--vbwd-color-primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: var(--vbwd-color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--vbwd-card-bg, #ffffff);
  padding: 25px;
  border-radius: 8px;
  box-shadow: var(--vbwd-card-shadow, 0 2px 5px rgba(0, 0, 0, 0.05));
}

.card h3 {
  margin-bottom: 20px;
  color: var(--vbwd-text-heading, #2c3e50);
  font-size: 1.1rem;
  border-bottom: 1px solid var(--vbwd-border-light, #eee);
  padding-bottom: 10px;
}

.card-link {
  display: block;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--vbwd-border-light, #eee);
  color: var(--vbwd-color-primary, #3498db);
  text-decoration: none;
  font-size: 0.9rem;
}

.card-link:hover {
  text-decoration: underline;
}

/* Profile Card */
.profile-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--vbwd-color-primary, #3498db), var(--vbwd-color-primary-hover, #2980b9));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vbwd-text-heading, #2c3e50);
}

.user-email {
  font-size: 0.9rem;
  color: var(--vbwd-text-muted, #666);
}

.user-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  text-transform: capitalize;
  width: fit-content;
}

.user-status.active {
  background: #d4edda;
  color: #155724;
}

/* Subscription Card */
.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.plan-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--vbwd-text-heading, #2c3e50);
}

.plan-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.plan-status.active {
  background: #d4edda;
  color: #155724;
}

.plan-status.cancelled,
.plan-status.cancelling {
  background: #f8d7da;
  color: #721c24;
}

.plan-status.trial {
  background: #fff3cd;
  color: #856404;
}

.subscription-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-item .label {
  color: var(--vbwd-text-muted, #666);
  font-size: 0.9rem;
}

.detail-item .value {
  font-weight: 500;
  color: var(--vbwd-text-heading, #2c3e50);
}

.detail-item .value.highlight {
  color: var(--vbwd-color-success, #27ae60);
  font-weight: 600;
}

.token-balance {
  padding-top: 10px;
  border-top: 1px solid #eee;
  margin-top: 5px;
}

.no-subscription {
  text-align: center;
  padding: 20px;
  color: #666;
}

.no-subscription .btn {
  margin-top: 15px;
  display: inline-block;
  padding: 10px 20px;
  background: var(--vbwd-color-primary, #3498db);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

/* Multi-subscriptions */
.multi-subs {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--vbwd-border-light, #eee);
}

.multi-subs h4 {
  font-size: 0.8rem;
  color: var(--vbwd-text-muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.multi-sub-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--vbwd-border-light, #f0f0f0);
}

.multi-sub-item:last-child {
  border-bottom: none;
}

.multi-sub-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vbwd-text-heading, #2c3e50);
}

/* Invoices Card */
.invoices-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.invoice-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invoice-number {
  font-weight: 500;
  color: #2c3e50;
}

.invoice-date {
  font-size: 0.8rem;
  color: #666;
}

.invoice-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.invoice-amount {
  font-weight: 600;
  color: #2c3e50;
}

.invoice-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  text-transform: capitalize;
}

.invoice-status.paid {
  background: #d4edda;
  color: #155724;
}

.invoice-status.pending {
  background: #fff3cd;
  color: #856404;
}

.invoice-status.overdue {
  background: #f8d7da;
  color: #721c24;
}

.no-invoices {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* Full Width Card */
.full-width {
  grid-column: 1 / -1;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
}

/* Subscription History Card */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-plan {
  font-weight: 500;
  color: #2c3e50;
}

.history-dates {
  font-size: 0.8rem;
  color: #666;
}

.history-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.history-status.active {
  background: #d4edda;
  color: #155724;
}

.history-status.cancelled,
.history-status.cancelling {
  background: #f8d7da;
  color: #721c24;
}

.history-status.expired {
  background: #e2e3e5;
  color: #383d41;
}

.history-status.paused {
  background: #fff3cd;
  color: #856404;
}

/* Add-ons Card */
.addons-section {
  margin-bottom: 15px;
}

.addons-section h4 {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.addon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 6px;
}

.addon-item-link,
.invoice-item-link {
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.addon-item-link:hover,
.invoice-item-link:hover {
  background-color: #e9ecef;
}

.addon-name {
  font-weight: 500;
  color: #2c3e50;
}

.addon-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.addon-status.active {
  background: #d4edda;
  color: #155724;
}

.addon-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.addon-status.expired {
  background: #e2e3e5;
  color: #383d41;
}

/* Token History Card */
.token-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.token-type {
  font-weight: 500;
  color: #2c3e50;
}

.token-date {
  font-size: 0.8rem;
  color: #666;
}

.token-amount {
  font-weight: 600;
  font-size: 1rem;
}

.token-amount.credit {
  color: var(--vbwd-color-success, #27ae60);
}

.token-amount.debit {
  color: var(--vbwd-color-danger, #e74c3c);
}

/* Actions Card */
.actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.action-btn {
  display: block;
  padding: 12px 15px;
  background-color: #f8f9fa;
  color: var(--vbwd-text-heading, #2c3e50);
  text-decoration: none;
  border-radius: 4px;
  text-align: center;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.action-btn:hover {
  background-color: var(--vbwd-color-primary, #3498db);
  color: white;
}
</style>
