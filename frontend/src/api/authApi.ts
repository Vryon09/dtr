import { apiClient } from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiClient<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiClient<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    apiClient<{ success: boolean; data: User }>('/api/auth/me', {
      method: 'GET',
    }),
};
