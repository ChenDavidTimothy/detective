// utils/auth-helpers.ts
export type AuthErrorType =
  | 'email-already-exists'
  | 'invalid-credentials'
  | 'weak-password'
  | 'expired-token'
  | 'unknown';

export interface AuthError {
  type: AuthErrorType;
  message: string;
}

/**
 * Maps Supabase auth errors to user-friendly errors
 */
export function parseAuthError(error: unknown): AuthError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  
  // Email already exists
  if (lowerMessage.includes('already registered') || 
      lowerMessage.includes('already in use') || 
      lowerMessage.includes('already exists')) {
    return {
      type: 'email-already-exists',
      message: 'This email is already registered. Please sign in instead.'
    };
  }
  
  // Invalid credentials
  if (lowerMessage.includes('invalid login credentials') || 
      lowerMessage.includes('invalid email') || 
      lowerMessage.includes('incorrect password')) {
    return {
      type: 'invalid-credentials',
      message: 'The email or password you entered is incorrect.'
    };
  }
  
  // Weak password
  if (lowerMessage.includes('password') && 
      (lowerMessage.includes('too weak') || 
       lowerMessage.includes('too short') || 
       lowerMessage.includes('should be'))) {
    return {
      type: 'weak-password',
      message: 'Password must be at least 6 characters long.'
    };
  }
  
  // Default case
  return {
    type: 'unknown',
    message: 'An error occurred. Please try again.'
  };
}