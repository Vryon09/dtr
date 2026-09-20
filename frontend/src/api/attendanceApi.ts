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
    apiClient<{ success: boolean; data: TodayAttendanceResponse }>('/attendance/today', {
      method: 'GET',
    }),

  getSummary: () =>
    apiClient<{ success: boolean; data: AttendanceSummaryResponse }>('/attendance/summary', {
      method: 'GET',
    }),

  getHistory: () =>
    apiClient<{ success: boolean; data: AttendanceRecord[] }>('/attendance', {
      method: 'GET',
    }),

  clockIn: (payload?: ClockActionPayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/attendance/clock-in', {
      method: 'POST',
      data: payload,
    }),

  startBreak: () =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/attendance/break-start', {
      method: 'POST',
    }),

  endBreak: () =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/attendance/break-end', {
      method: 'POST',
    }),

  clockOut: (payload?: ClockActionPayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/attendance/clock-out', {
      method: 'POST',
      data: payload,
    }),

  createManual: (payload: CreateManualAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>('/attendance/manual', {
      method: 'POST',
      data: payload,
    }),

  updateAttendance: (id: string, payload: UpdateAttendancePayload) =>
    apiClient<{ success: boolean; data: AttendanceRecord; message?: string }>(`/attendance/${id}`, {
      method: 'PUT',
      data: payload,
    }),

  deleteAttendance: (id: string) =>
    apiClient<{ success: boolean; message?: string }>(`/attendance/${id}`, {
      method: 'DELETE',
    }),
};
