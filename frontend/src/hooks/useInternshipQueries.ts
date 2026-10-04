import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { internshipApi } from '../api/internshipApi';
import { internshipKeys, attendanceKeys, authKeys } from './queryKeys';
import type {
  CreateInternshipPayload,
  UpdateInternshipPayload,
} from '../types/internship';

export function useInternships() {
  return useQuery({
    queryKey: internshipKeys.list(),
    queryFn: async () => {
      const res = await internshipApi.list();
      return res.data || [];
    },
  });
}

export function useActiveInternship() {
  const { data: internships = [] } = useInternships();
  return internships.find((i) => i.isActive) || internships[0] || null;
}

export function useCreateInternshipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInternshipPayload) => internshipApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useUpdateInternshipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInternshipPayload }) =>
      internshipApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useSwitchInternshipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => internshipApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

export function useDeleteInternshipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => internshipApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}
