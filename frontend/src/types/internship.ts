export type InternshipStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Internship {
  id: string;
  userId: string;
  title: string;
  companyName: string | null;
  requiredHours: number;
  status: InternshipStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface InternshipSummary extends Internship {
  isActive: boolean;
  completedHours: number;
  remainingHours: number;
  progressPercentage: number;
  totalLogsCount: number;
}

export interface CreateInternshipPayload {
  title: string;
  companyName?: string;
  requiredHours: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateInternshipPayload {
  title?: string;
  companyName?: string | null;
  requiredHours?: number;
  status?: InternshipStatus;
  startDate?: string | null;
  endDate?: string | null;
}
