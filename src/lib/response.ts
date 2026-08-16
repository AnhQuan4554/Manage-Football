export type AppResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export function ok<T>(data: T, message?: string): AppResponse<T> {
  return { success: true, data, message };
}

export function fail(error: string, message?: string): AppResponse<never> {
  return { success: false, error, message };
}
