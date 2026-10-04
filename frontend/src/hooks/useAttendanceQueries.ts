import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { attendanceKeys } from './queryKeys';
import type {
  BatchUpdateAttendancePayload,
  BulkImportPayload,
  ClockActionPayload,
  CreateManualAttendancePayload,
  UpdateAttendancePayload,
} from '../types/attendance';

export function useAttendanceToday(internshipId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.today(), internshipId ?? 'active'],
    queryFn: async () => {
      const res = await attendanceApi.getToday(internshipId);
      return res.data;
    },
  });
}

export function useAttendanceSummary(internshipId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.summary(), internshipId ?? 'active'],
    queryFn: async () => {
      const res = await attendanceApi.getSummary(internshipId);
      return res.data;
    },
  });
}

export function useAttendanceHistory(internshipId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.history(), internshipId ?? 'active'],
    queryFn: async () => {
      const res = await attendanceApi.getHistory(internshipId);
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

export function useStartBreakMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceApi.startBreak(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useEndBreakMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceApi.endBreak(),
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

export function useBatchDeleteAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => attendanceApi.batchDeleteAttendance(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useBatchUpdateAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BatchUpdateAttendancePayload) =>
      attendanceApi.batchUpdateAttendance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}


export function useParseDtrMutation() {
  return useMutation({
    mutationFn: (formData: FormData) => attendanceApi.parseDtr(formData),
  });
}

export function useBulkImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkImportPayload) => attendanceApi.bulkImport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

