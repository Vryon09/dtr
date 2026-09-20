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
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  clockOut: (payload?: ClockActionPayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/api/attendance/clock-out', {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  createManual: (payload: CreateManualAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/api/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAttendance: (id: string, payload: UpdateAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>(`/api/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAttendance: (id: string) =>
    apiClient<{ success: boolean; message?: string }>(`/api/attendance/${id}`, {
      method: 'DELETE',
    }),
};
