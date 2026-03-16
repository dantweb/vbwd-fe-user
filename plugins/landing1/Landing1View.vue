<template>
  <div class="landing1">
    <div class="landing1-header">
      <h1 data-testid="landing1-title">
        {{ $t('landing1.title') }}
      </h1>
      <p class="subtitle">
        {{ $t('landing1.subtitle') }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
      data-testid="landing1-loading"
    >
      <div class="spinner" />
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
      data-testid="landing1-error"
    >
      <p>{{ error }}</p>
      <button
        class="retry-btn"
        @click="loadPlans"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="plans.length === 0"
      class="empty-state"
      data-testid="landing1-empty"
    >
      <p>{{ $t('landing1.noPlans') }}</p>
    </div>

    <!-- Plan Cards Grid -->
    <div
      v-else
      class="plans-grid"
      data-testid="landing1-plans"
    >
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :data-testid="`plan-card-${plan.slug}`"
      >
        <h2 class="plan-name">
          {{ plan.name }}
        </h2>
        <div class="plan-price">
          {{ formatPrice(plan.display_price, plan.display_currency) }}
          <span
            v-if="plan.billing_period"
            class="billing-period"
          >/{{ formatBillingPeriod(plan.billing_period) }}</span>
        </div>
        <p
          v-if="plan.description"
          class="plan-description"
        >
          {{ plan.description }}
        </p>
        <button
          class="choose-plan-btn"
          :data-testid="`choose-plan-${plan.slug}`"
          @click="choosePlan(plan)"
        >
          {{ $t('landing1.choosePlan') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

export interface TarifPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_price: number;
  display_currency: string;
  billing_period?: string;
  is_active?: boolean;
}

const props = defineProps<{
  embedMode?: boolean;
  category?: string;
  planSlugs?: string[];
}>();

const emit = defineEmits<{
  (e: 'plan-selected', plan: { slug: string; name: string; price: number; currency: string }): void;
}>();

const router = useRouter();
const { t } = useI18n();

const plans = ref<TarifPlan[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadPlans() {
  loading.value = true;
  error.value = null;
  try {
    const url = props.category
      ? `/api/v1/tarif-plans?category=${encodeURIComponent(props.category)}`
      : '/api/v1/tarif-plans';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load plans');
    const data = await response.json();
    const all = (data.plans || []).filter((p: TarifPlan) => p.is_active !== false);
    plans.value = props.planSlugs?.length
      ? all.filter((p: TarifPlan) => props.planSlugs!.includes(p.slug))
      : all;
  } catch (e) {
    error.value = (e as Error).message || t('common.errors.generic');
  } finally {
    loading.value = false;
  }
}

function choosePlan(plan: TarifPlan) {
  if (props.embedMode) {
    emit('plan-selected', {
      slug: plan.slug,
      name: plan.name,
      price: plan.display_price,
      currency: plan.display_currency,
    });
  } else {
    router.push({ path: '/checkout', query: { tarif_plan_id: plan.slug } });
  }
}

function formatPrice(price: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(price);
}

function formatBillingPeriod(period?: string): string {
  if (!period) return 'month';
  const periodMap: Record<string, string> = {
    monthly: 'month',
    yearly: 'year',
    annual: 'year',
    weekly: 'week',
    MONTHLY: 'month',
    YEARLY: 'year',
  };
  return periodMap[period] || period.toLowerCase();
}

onMounted(() => {
  loadPlans();
});
</script>

<style>
/* Non-scoped so CMS page styles and NativePricingPlans widget CSS can override these rules. */
.landing1 {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.landing1-header {
  text-align: center;
  margin-bottom: 40px;
}

.landing1-header h1 {
  font-size: 2rem;
  color: var(--vbwd-text-heading, #2c3e50);
  margin-bottom: 10px;
}

.landing1 .subtitle {
  color: var(--vbwd-text-muted, #666);
  font-size: 1.1rem;
}

.landing1 .loading-state,
.landing1 .error-state,
.landing1 .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--vbwd-text-muted, #666);
}

.landing1 .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--vbwd-border-light, #f3f3f3);
  border-top: 3px solid var(--vbwd-color-primary, #3498db);
  border-radius: 50%;
  animation: landing1-spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes landing1-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.landing1 .retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: var(--vbwd-color-primary, #3498db);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.landing1 .plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.landing1 .plan-card {
  background: var(--vbwd-card-bg, #fff);
  padding: 30px;
  border-radius: 12px;
  box-shadow: var(--vbwd-card-shadow, 0 2px 10px rgba(0, 0, 0, 0.08));
  text-align: center;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.landing1 .plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: var(--vbwd-color-primary, #3498db);
}

.landing1 .plan-name {
  font-size: 1.4rem;
  color: var(--vbwd-text-heading, #2c3e50);
  margin-bottom: 15px;
}

.landing1 .plan-price {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vbwd-color-primary, #3498db);
  margin-bottom: 15px;
}

.landing1 .billing-period {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--vbwd-text-muted, #666);
}

.landing1 .plan-description {
  color: var(--vbwd-text-muted, #666);
  font-size: 0.9rem;
  margin-bottom: 20px;
  line-height: 1.5;
}

.landing1 .choose-plan-btn {
  width: 100%;
  padding: 14px;
  background-color: var(--vbwd-color-primary, #3498db);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.landing1 .choose-plan-btn:hover {
  background-color: var(--vbwd-color-primary-hover, #2980b9);
}
</style>
