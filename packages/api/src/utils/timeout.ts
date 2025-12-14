/**
 * Utility for adding timeout protection to async operations
 */

/**
 * Wraps a promise with a timeout
 * Rejects if the promise doesn't resolve within the timeout period
 * Properly cleans up the timeout when promise resolves
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([
    promise.then((result) => {
      clearTimeout(timeoutId);
      return result;
    }).catch((error) => {
      clearTimeout(timeoutId);
      throw error;
    }),
    timeoutPromise,
  ]);
}

/**
 * Wraps an async function with timeout protection
 */
export function withTimeoutFn<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  timeoutMs: number,
  errorMessage?: string
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => withTimeout(fn(...args), timeoutMs, errorMessage);
}
