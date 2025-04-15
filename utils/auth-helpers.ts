export type AuthErrorType =
  | 'email-already-exists'
  | 'invalid-credentials'
  | 'weak-password'
  | 'expired-token'
  | 'unknown';

export interface NormalizedAuthError {
  type: AuthErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * Normalizes Supabase authentication errors into consistent user-friendly messages
 */
export function normalizeAuthError(error: unknown): NormalizedAuthError {
  const message = error instanceof Error ? error.message : String(error);

  // Check for email already exists errors
  if (
    message.includes('already registered') ||
    message.includes('already in use') ||
    message.includes('User already exists') ||
    message.includes('Email address is already registered')
  ) {
    return {
      type: 'email-already-exists',
      message: "Email already exists. Please sign in instead.",
      originalError: error
    };
  }

  // Invalid credentials
  if (
    message.includes('Invalid login credentials') ||
    message.includes('Invalid email or password')
  ) {
    return {
      type: 'invalid-credentials',
      message: "The email or password you entered is incorrect.",
      originalError: error
    };
  }

  // Weak password
  if (message.includes('Password should be')) {
    return {
      type: 'weak-password',
      message: "Please use a stronger password. It should be at least 6 characters long.",
      originalError: error
    };
  }

  // Expired token
  if (
    message.includes('Token expired') ||
    message.includes('JWT expired')
  ) {
    return {
      type: 'expired-token',
      message: "Your session has expired. Please sign in again.",
      originalError: error
    };
  }

  // Default case for unknown errors
  return {
    type: 'unknown',
    message: "An error occurred during authentication. Please try again.",
    originalError: error
  };
}
