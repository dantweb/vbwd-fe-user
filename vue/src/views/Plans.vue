<template>
  <div class="plans">
    <h1>{{ $t('plans.title') }}</h1>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
      data-testid="plans-loading"
    >
      <div class="spinner" />
      <p>{{ $t('plans.loading') }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
      data-testid="plans-error"
    >
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="loadPlans"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- No Plans -->
    <div
      v-else-if="plans.length === 0"
      class="no-plans"
      data-testid="no-plans"
    >
      <p>{{ $t('plans.noPlans') }}</p>
    </div>

    <!-- Plans Grid -->
    <div
      v-else
      class="plans-grid"
      data-testid="plans-grid"
    >
      <div
        v-for="plan in plans"
        :key="plan.id"
        :class="['plan-card', { popular: plan.popular, current: isCurrentPlan(plan.id) }]"
        :data-testid="`plan-${plan.slug}`"
      >
        <div
          v-if="plan.popular"
          class="popular-badge"
        >
          {{ $t('plans.mostPopular') }}
        </div>
        <div
          v-if="isCurrentPlan(plan.id)"
          class="current-badge"
        >
          {{ $t('plans.currentPlan') }}
        </div>
        <h2>{{ plan.name }}</h2>
        <div class="price">
          <span class="amount">{{ formatPrice(plan.display_price) }}</span>
          <span class="period">/{{ formatBillingPeriod(plan.billing_period) }}</span>
        </div>
        <p
          v-if="plan.description"
          class="description"
        >
          {{ plan.description }}
        </p>
        <ul
          v-if="plan.features && plan.features.length > 0"
          class="features"
        >
          <li
            v-for="feature in plan.features"
            :key="feature"
          >
            {{ feature }}
          </li>
        </ul>
        <div
          v-if="plan.tax_rate !== undefined"
          class="tax-info"
        >
          <span class="tax-rate">{{ $t('plans.taxIncluded', { rate: plan.tax_rate }) }}</span>
        </div>
        <button
          :class="['select-btn', { disabled: isCurrentPlan(plan.id) }]"
          :disabled="isCurrentPlan(plan.id) || subscribing"
          :data-testid="`select-plan-${plan.slug}`"
          @click="selectPlan(plan)"
        >
          <span v-if="subscribing && selectedPlanId === plan.id">{{ $t('plans.processing') }}</span>
          <span v-else-if="isCurrentPlan(plan.id)">{{ $t('plans.currentPlan') }}</span>
          <span v-else>{{ $t('plans.selectPlan') }}</span>
        </button>
      </div>
    </div>

    <!-- Currency Selector -->
    <div
      v-if="plans.length > 0"
      class="currency-selector"
    >
      <label for="currency">{{ $t('plans.currencyLabel') }}</label>
      <select
        id="currency"
        v-model="selectedCurrency"
        data-testid="currency-select"
        @change="loadPlans"
      >
        <option value="EUR">
          EUR
        </option>
        <option value="USD">
          USD
        </option>
        <option value="GBP">
          GBP
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePlansStore, type Plan } from '../stores/plans';
import { useSubscriptionStore } from '../stores/subscription';

const router = useRouter();
const { t } = useI18n();
const plansStore = usePlansStore();
const subscriptionStore = useSubscriptionStore();

const selectedCurrency = ref('EUR');
const subscribing = ref(false);
const selectedPlanId = ref<string | null>(null);

const loading = computed(() => plansStore.loading);
const error = computed(() => plansStore.error);
const plans = computed(() => plansStore.plans);

const currentSubscription = computed(() => subscriptionStore.subscription);

function isCurrentPlan(planId: string): boolean {
  return currentSubscription.value?.plan?.id === planId;
}

async function loadPlans(): Promise<void> {
  try {
    await plansStore.fetchPlans(selectedCurrency.value);
  } catch {
    // Error is handled in store
  }
}

async function selectPlan(plan: Plan): Promise<void> {
  if (isCurrentPlan(plan.id)) return;

  // Navigate to checkout with plan info
  router.push({
    name: 'checkout',
    params: { planSlug: plan.slug },
  });
}

function formatPrice(price: number): string {
  const currencySymbols: Record<string, string> = {
    EUR: '\u20AC',
    USD: '$',
    GBP: '\u00A3',
  };
  const symbol = currencySymbols[selectedCurrency.value] || selectedCurrency.value;
  return `${symbol}${price.toFixed(2)}`;
}

function formatBillingPeriod(period?: string): string {
  if (!period) return 'month';
  const periodMap: Record<string, string> = {
    monthly: t('common.billingPeriods.month'),
    yearly: t('common.billingPeriods.year'),
    annual: t('common.billingPeriods.year'),
    weekly: t('common.billingPeriods.week'),
  };
  return periodMap[period.toLowerCase()] || period;
}

onMounted(async () => {
  // Load current subscription to check which plan is active
  try {
    await subscriptionStore.fetchSubscription();
  } catch {
    // No active subscription
  }
  await loadPlans();
});
</script>

<style scoped>
.plans {
  max-width: 1200px;
}

h1 {
  margin-bottom: 40px;
  color: #2c3e50;
  text-align: center;
}

.loading-state,
.error-state,
.no-plans {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
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
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.plan-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.plan-card.popular {
  border-color: #3498db;
}

.plan-card.current {
  border-color: #27ae60;
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #3498db;
  color: white;
  padding: 4px 15px;
  border-radius: 20px;
  font-size: 0.8rem;
}

.current-badge {
  position: absolute;
  top: -12px;
  right: 15px;
  background-color: #27ae60;
  color: white;
  padding: 4px 15px;
  border-radius: 20px;
  font-size: 0.8rem;
}

.plan-card h2 {
  margin-bottom: 15px;
  color: #2c3e50;
  text-align: center;
}

.price {
  text-align: center;
  margin-bottom: 20px;
}

.amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.period {
  color: #666;
}

.description {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.features {
  list-style: none;
  margin-bottom: 20px;
}

.features li {
  padding: 8px 0;
  color: #666;
  border-bottom: 1px solid #eee;
}

.features li:last-child {
  border-bottom: none;
}

.features li::before {
  content: "\2713";
  color: #27ae60;
  margin-right: 8px;
}

.tax-info {
  text-align: center;
  margin-bottom: 15px;
}

.tax-rate {
  font-size: 0.8rem;
  color: #999;
}

.select-btn {
  width: 100%;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.select-btn.disabled,
.select-btn:disabled {
  background-color: #95a5a6;
  cursor: default;
}

.currency-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.currency-selector label {
  color: #666;
}

.currency-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
</style>
