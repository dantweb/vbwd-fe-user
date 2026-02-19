import { defineStore } from 'pinia';
import { api } from '@/api';

export interface Profile {
  id: string;
  name: string;
  email: string;
}

// Backend response types
interface BackendUser {
  id: string;
  email: string;
  status: string;
  role: string;
}

interface BackendDetails {
  first_name?: string;
  last_name?: string;
}

interface BackendProfileResponse {
  user: BackendUser;
  details: BackendDetails | null;
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as Profile | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchProfile() {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.get('/user/profile') as BackendProfileResponse;

        // Transform backend response to frontend Profile format
        const firstName = response.details?.first_name || '';
        const lastName = response.details?.last_name || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || response.user.email;

        this.profile = {
          id: response.user.id,
          email: response.user.email,
          name: name
        };

        return this.profile;
      } catch (error) {
        this.error = (error as Error).message || 'Failed to fetch profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateProfile(data: Partial<Profile>) {
      this.loading = true;
      this.error = null;

      try {
        // Transform frontend data to backend format
        const backendData: { first_name?: string; last_name?: string } = {};
        if (data.name) {
          const nameParts = data.name.split(' ');
          backendData.first_name = nameParts[0] || '';
          backendData.last_name = nameParts.slice(1).join(' ') || '';
        }

        await api.put('/user/details', backendData);

        // Update local profile
        if (this.profile && data.name) {
          this.profile.name = data.name;
        }

        return this.profile;
      } catch (error) {
        this.error = (error as Error).message || 'Failed to update profile';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/user/change-password', {
          currentPassword,
          newPassword
        });
        return response as { success: boolean };
      } catch (error) {
        this.error = (error as Error).message || 'Failed to change password';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.profile = null;
      this.error = null;
      this.loading = false;
    }
  }
});
