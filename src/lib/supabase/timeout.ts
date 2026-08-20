const defaultTimeoutMs = process.env.NODE_ENV === "development" ? 10000 : 8000;

export function getSupabaseTimeoutMs() {
  return Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? defaultTimeoutMs);
}

export async function withSupabaseTimeout<T>(operation: PromiseLike<T>, label = "Supabase request") {
  let timeout: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${getSupabaseTimeoutMs()}ms`)), getSupabaseTimeoutMs());
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}
