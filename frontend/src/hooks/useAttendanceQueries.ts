import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { attendanceKeys } from './queryKeys';
import type {
  ClockActionPayload,
  CreateManualAttendancePayload,
  UpdateAttendancePayload,
} from '../types/attendance';

export function useAttendanceToday() {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: async () => {
      const res = await attendanceApi.getToday();
      return res.data;
    },
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: attendanceKeys.summary(),
    queryFn: async () => {
      const res = await attendanceApi.getSummary();
      return res.data;
    },
  });
}

export function useAttendanceHistory() {
  return useQuery({
    queryKey: attendanceKeys.history(),
    queryFn: async () => {
      const res = await attendanceApi.getHistory();
      return res.data || [];
    },
  });
}

export function useClockInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: ClockActionPayload) => attendanceApi.clockIn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useClockOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: ClockActionPayload) => attendanceApi.clockOut(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useCreateManualAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManualAttendancePayload) => attendanceApi.createManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useUpdateAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAttendancePayload }) =>
      attendanceApi.updateAttendance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useDeleteAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
