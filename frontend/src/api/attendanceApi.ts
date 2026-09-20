import { apiClient } from './client';
import type {
  AttendanceRecord,
  AttendanceSummaryResponse,
  ClockActionPayload,
  CreateManualAttendancePayload,
  TodayAttendanceResponse,
  UpdateAttendancePayload,
} from '../types/attendance';

export const attendanceApi = {
  getToday: () =>
    apiClient<{ success: boolean; data: TodayAttendanceResponse }>('/api/attendance/today', {
      method: 'GET',
    }),

  getSummary: () =>
    apiClient<{ success: boolean; data: AttendanceSummaryResponse }>('/api/attendance/summary', {
      method: 'GET',
    }),

  getHistory: () =>
    apiClient<{ success: boolean; data: AttendanceRecord[] }>('/api/attendance', {
      method: 'GET',
    }),

  clockIn: (payload?: ClockActionPayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/api/attendance/clock-in', {
      method: 'POST',
      data: payload,
    }),

  clockOut: (payload?: ClockActionPayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/api/attendance/clock-out', {
      method: 'POST',
      data: payload,
    }),

  createManual: (payload: CreateManualAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/api/attendance/manual', {
      method: 'POST',
      data: payload,
    }),

  updateAttendance: (id: string, payload: UpdateAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>(`/api/attendance/${id}`, {
      method: 'PUT',
      data: payload,
    }),

  deleteAttendance: (id: string) =>
    apiClient<{ success: boolean; message?: string }>(`/api/attendance/${id}`, {
      method: 'DELETE',
    }),
};
