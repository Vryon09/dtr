import type { User } from './auth';

export type UserSettings = User;

export interface UpdateSettingsPayload {
  name?: string;
  email?: string;
  requiredHours?: number;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
