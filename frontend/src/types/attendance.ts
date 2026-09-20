export type AttendanceStatus = 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';

export interface AttendanceRecord {
  id: string;
  userId: string;
  workingDate: string;
  clockInAt: string;
  clockOutAt: string | null;
  breakStartAt?: string | null;
  breakEndAt?: string | null;
  breakMinutes: number;
  renderedHours: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayAttendanceResponse {
  status: AttendanceStatus;
  attendance: AttendanceRecord | null;
}

export interface AttendanceSummaryResponse {
  requiredHours: number;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
}

export interface ClockActionPayload {
  notes?: string;
}

export interface CreateManualAttendancePayload {
  date: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

export interface UpdateAttendancePayload {
  date?: string;
  clockIn?: string;
  clockOut?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  notes?: string | null;
}
