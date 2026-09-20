export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiErrorResponse['error'];
}
