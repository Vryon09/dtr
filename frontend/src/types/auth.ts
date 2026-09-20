export interface User {
  id: string;
  name: string;
  email: string;
  requiredHours: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  requiredHours?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
  message?: string;
}
