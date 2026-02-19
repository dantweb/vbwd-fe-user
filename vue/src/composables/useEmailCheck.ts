import { ref, computed } from 'vue';
import { api } from '@/api';

type EmailState = 'idle' | 'checking' | 'new_user' | 'existing_user' | 'error';

export function useEmailCheck() {
  const state = ref<EmailState>('idle');
  const email = ref('');
  const error = ref<string | null>(null);

  const isValidEmail = (emailStr: string): boolean => {
    // Strict validation: exclude + symbol per Q&A decision
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(emailStr) && !emailStr.includes('+');
  };

  const checkEmail = async (inputEmail: string, captchaToken?: string): Promise<void> => {
    const normalized = inputEmail.trim().toLowerCase();

    if (!isValidEmail(normalized)) {
      state.value = 'idle';
      return;
    }

    email.value = normalized;
    state.value = 'checking';
    error.value = null;

    try {
      const params = new URLSearchParams({ email: normalized });
      if (captchaToken) {
        params.append('captcha_token', captchaToken);
      }
      const response = await api.get(`/auth/check-email?${params.toString()}`) as { exists: boolean };
      state.value = response.exists ? 'existing_user' : 'new_user';
    } catch (e) {
      state.value = 'error';
      error.value = 'Failed to check email';
    }
  };

  const reset = () => {
    state.value = 'idle';
    email.value = '';
    error.value = null;
  };

  return {
    state,
    email,
    error,
    checkEmail,
    reset,
    isNewUser: computed(() => state.value === 'new_user'),
    isExistingUser: computed(() => state.value === 'existing_user'),
    isChecking: computed(() => state.value === 'checking'),
  };
}
