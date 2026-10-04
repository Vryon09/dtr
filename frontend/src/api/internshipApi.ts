import { apiClient } from './client';
import type {
  Internship,
  InternshipSummary,
  CreateInternshipPayload,
  UpdateInternshipPayload,
} from '../types/internship';

export const internshipApi = {
  list: () =>
    apiClient<{ success: boolean; data: InternshipSummary[] }>('/internships', {
      method: 'GET',
    }),

  getActive: () =>
    apiClient<{ success: boolean; data: Internship }>('/internships/active', {
      method: 'GET',
    }),

  create: (payload: CreateInternshipPayload) =>
    apiClient<{ success: boolean; data: InternshipSummary }>('/internships', {
      method: 'POST',
      data: payload,
    }),

  update: (id: string, payload: UpdateInternshipPayload) =>
    apiClient<{ success: boolean; data: Internship }>(`/internships/${id}`, {
      method: 'PATCH',
      data: payload,
    }),

  activate: (id: string) =>
    apiClient<{ success: boolean; data: Internship; message: string }>(`/internships/${id}/activate`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/internships/${id}`, {
      method: 'DELETE',
    }),
};
