import { apiClient } from './client';
import type { UpdatePasswordPayload, UpdateSettingsPayload, UserSettings } from '../types/settings';

export const settingsApi = {
  getSettings: () =>
    apiClient<{ success: boolean; data: UserSettings }>('/settings', {
      method: 'GET',
    }),

  updateSettings: (payload: UpdateSettingsPayload) =>
    apiClient<{ success: boolean; data: UserSettings }>('/settings', {
      method: 'PATCH',
      data: payload,
    }),

  updatePassword: (payload: UpdatePasswordPayload) =>
    apiClient<{ success: boolean; message: string }>('/settings/password', {
      method: 'PATCH',
      data: payload,
    }),
};
