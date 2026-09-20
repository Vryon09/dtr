import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "../types/api";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    status: number = 500,
    details?: Array<{ field?: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse | { message?: string }>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const errorPayload = (data as ApiErrorResponse)?.error;
      const directMessage = (data as { message?: string })?.message;
      const message =
        directMessage ||
        errorPayload?.message ||
        error.response.statusText ||
        "Request failed";
      const code = errorPayload?.code || "REQUEST_FAILED";
      const details = errorPayload?.details;

      return Promise.reject(new ApiError(message, code, status, details));
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(
          "Network error. Please check your connection.",
          "NETWORK_ERROR",
          0,
        ),
      );
    }

    return Promise.reject(
      new ApiError(error.message, "REQUEST_SETUP_ERROR", 500),
    );
  },
);

export async function apiClient<T>(
  endpoint: string,
  options: AxiosRequestConfig & {
    params?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const response = await axiosInstance.request<T>({
    url: endpoint,
    ...options,
  });
  return response.data;
}
