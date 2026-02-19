import { ref, computed } from 'vue';
import { api } from '@/api';

export interface PaymentMethod {
  code: string;
  name: string;
  description: string | null;
  short_description: string | null;
  icon: string | null;
  is_active: boolean;
  position: number;
  instructions: string | null;
}

export function usePaymentMethods() {
  const methods = ref<PaymentMethod[]>([]);
  const selectedMethodCode = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadMethods = async (locale?: string, currency?: string, country?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();
      if (locale) params.append('locale', locale);
      if (currency) params.append('currency', currency);
      if (country) params.append('country', country);

      const url = `/settings/payment-methods${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url) as { methods: PaymentMethod[] };
      methods.value = response.methods;

      // Auto-select first method if none selected
      if (methods.value.length > 0 && !selectedMethodCode.value) {
        selectedMethodCode.value = methods.value[0].code;
      }
    } catch (e) {
      error.value = 'Failed to load payment methods';
    } finally {
      loading.value = false;
    }
  };

  const selectMethod = (methodCode: string) => {
    const method = methods.value.find(m => m.code === methodCode);
    if (method) {
      selectedMethodCode.value = methodCode;
    }
  };

  const selectedMethod = computed(() =>
    methods.value.find(m => m.code === selectedMethodCode.value) || null
  );

  const hasSelection = computed(() => selectedMethodCode.value !== null);

  const reset = () => {
    methods.value = [];
    selectedMethodCode.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    methods,
    loading,
    error,
    selectedMethodCode,
    selectedMethod,
    hasSelection,
    loadMethods,
    selectMethod,
    reset,
  };
}
