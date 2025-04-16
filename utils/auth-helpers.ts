// utils/auth-helpers.ts
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
    message.toLowerCase().includes('already registered') ||
    message.toLowerCase().includes('already in use') ||
    message.toLowerCase().includes('user already exists') ||
    message.toLowerCase().includes('email address is already registered') ||
    message.toLowerCase().includes('account conflict') ||
    message.toLowerCase().includes('existing account') ||
    message.toLowerCase().includes('email already exists')
  ) {
    return {
      type: 'email-already-exists',
      message: "Email already exists. Please sign in instead.",
      originalError: error
    };
  }

  // Invalid credentials
  if (
    message.toLowerCase().includes('invalid login credentials') ||
    message.toLowerCase().includes('invalid email or password') ||
    message.toLowerCase().includes('incorrect email') ||
    message.toLowerCase().includes('incorrect password')
  ) {
    return {
      type: 'invalid-credentials',
      message: "The email or password you entered is incorrect.",
      originalError: error
    };
  }

  // Weak password
  if (
    message.toLowerCase().includes('password should be') ||
    message.toLowerCase().includes('password too weak') ||
    message.toLowerCase().includes('password requirements')
  ) {
    return {
      type: 'weak-password',
      message: "Please use a stronger password. It should be at least 6 characters long.",
      originalError: error
    };
  }

  // Expired token
  if (
    message.toLowerCase().includes('token expired') ||
    message.toLowerCase().includes('jwt expired') ||
    message.toLowerCase().includes('session expired')
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