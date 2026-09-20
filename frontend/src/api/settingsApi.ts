import { apiClient } from './client';
import type { UpdatePasswordPayload, UpdateSettingsPayload, UserSettings } from '../types/settings';

export const settingsApi = {
  getSettings: () =>
    apiClient<{ success: boolean; data: UserSettings }>('/api/settings', {
      method: 'GET',
    }),

  updateSettings: (payload: UpdateSettingsPayload) =>
    apiClient<{ success: boolean; data: UserSettings }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updatePassword: (payload: UpdatePasswordPayload) =>
    apiClient<{ success: boolean; message: string }>('/api/settings/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
