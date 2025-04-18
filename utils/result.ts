// Types for the result object with discriminated union
export type Success<T> = { data: T; error: null }
export type Failure<E> = { data: null; error: E }
export type Result<T, E = Error> = Success<T> | Failure<E>

// Main wrapper function - designed as a baseline improvement for async error handling
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as E }
  }
}

// Helper function to check if a result is successful
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.error === null
}

// Helper function to check if a result is a failure
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.error !== null
}

// Helper function to unwrap a result, throwing if it's a failure
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isFailure(result)) {
    throw result.error
  }
  return result.data
}

// Helper function to unwrap a result with a default value
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isFailure(result)) {
    return defaultValue
  }
  return result.data
} 