/**
 * Shared API Client Instance
 *
 * Singleton ApiClient used by all stores and components.
 * This ensures the auth token is shared across the application.
 */
import { ApiClient } from '@dantweb/view-component';
import { ref } from 'vue';

// Session expired state - reactive so components can react to it
export const sessionExpired = ref(false);
export const sessionExpiredMessage = ref('');

// Singleton API client instance
export const api = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1'
});

/**
 * Initialize API client with token from localStorage
 * Call this on app startup to restore authentication state
 */
export function initializeApi(): void {
  const token = localStorage.getItem('auth_token');
  if (token) {
    api.setToken(token);
  }

  // Setup token expiry handler
  api.on('token-expired', () => {
    handleSessionExpiry('Your session has expired. Please log in again.');
  });
}

/**
 * Handle session expiry
 * Clears auth state and sets the expired flag
 */
export function handleSessionExpiry(message = 'Session expired'): void {
  // Only trigger once
  if (sessionExpired.value) return;

  sessionExpired.value = true;
  sessionExpiredMessage.value = message;

  // Clear auth state
  clearApiAuth();
}

/**
 * Clear session expired state
 * Call this after user acknowledges the expiry modal
 */
export function clearSessionExpiry(): void {
  sessionExpired.value = false;
  sessionExpiredMessage.value = '';
}

/**
 * Clear API authentication
 * Call this on logout to clear the token
 */
export function clearApiAuth(): void {
  api.clearToken();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

// Initialize on module load
initializeApi();
