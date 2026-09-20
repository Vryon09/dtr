import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settingsApi';
import { settingsKeys, authKeys, attendanceKeys } from './queryKeys';
import type { UpdatePasswordPayload, UpdateSettingsPayload } from '../types/settings';

export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.userSettings(),
    queryFn: async () => {
      const res = await settingsApi.getSettings();
      return res.data;
    },
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => settingsApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summary() });
    },
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => settingsApi.updatePassword(payload),
  });
}
