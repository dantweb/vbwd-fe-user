/**
 * Shared API Client Instance
 *
 * Singleton ApiClient used by all stores and components.
 * This ensures the auth token is shared across the application.
 */
import { ApiClient } from 'vbwd-view-component';
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
 *
 * Special-case: on /checkout/* routes the user is treated as a fresh
 * anonymous visitor (the checkout view supports inline login/signup via
 * EmailBlock — there is no guest checkout, but the user picks their own
 * path). Showing the "Session Expired → Log In" modal forces a full
 * detour through the login page and loses checkout context. Instead we
 * silently clear auth state and reload so the view re-mounts in its
 * anonymous flow.
 */
export function handleSessionExpiry(message = 'Session expired'): void {
  // Only trigger once
  if (sessionExpired.value) return;

  // Always clear auth — whether or not we show the modal.
  clearApiAuth();

  if (isOnCheckoutRoute()) {
    // Reload so PublicCheckoutView's `isAuthenticated` ref re-reads
    // localStorage and re-renders the EmailBlock in its anonymous state
    // (login + sign-up tabs). No modal, no /login redirect.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  sessionExpired.value = true;
  sessionExpiredMessage.value = message;
}

function isOnCheckoutRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/checkout');
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

/**
 * Check if user has a specific user-facing permission.
 * Permissions are stored in localStorage on login.
 */
export function hasUserPermission(permission: string): boolean {
  try {
    const raw = localStorage.getItem('user_permissions');
    if (!raw) return false;
    const perms: string[] = JSON.parse(raw);
    if (perms.includes('*')) return true;
    if (perms.includes(permission)) return true;
    return perms.some(
      (p) => p.endsWith('.*') && permission.startsWith(p.slice(0, -1))
    );
  } catch {
    return false;
  }
}

/**
 * Get all user permissions from localStorage.
 */
export function getUserPermissions(): string[] {
  try {
    const raw = localStorage.getItem('user_permissions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Initialize on module load
initializeApi();
