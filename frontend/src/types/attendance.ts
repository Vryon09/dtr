export type AttendanceStatus = 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';

export interface AttendanceRecord {
  id: string;
  userId: string;
  workingDate: string;
  clockInAt: string;
  clockOutAt: string | null;
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
  notes?: string;
}

export interface UpdateAttendancePayload {
  date?: string;
  clockIn?: string;
  clockOut?: string | null;
  notes?: string | null;
}
