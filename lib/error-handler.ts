/**
 * Centralized error handling utility
 * This helps ensure consistent error handling and prevents leaking sensitive information in production
 */

// Define error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  SERVER = 'SERVER_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
}

// Interface for structured error logging
interface ErrorLogData {
  type: ErrorType;
  message: string;
  path?: string;
  userId?: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * Log error details - in production, this would send to a logging service
 * like Sentry, LogRocket, etc.
 */
export function logError(errorData: ErrorLogData): void {
  // In development, log to console with details
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', {
      type: errorData.type,
      message: errorData.message,
      path: errorData.path,
      userId: errorData.userId,
      stack: errorData.stack,
      context: errorData.context,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // In production, we would send this to a logging service
  // This is a placeholder for actual implementation
  console.error('ERROR:', {
    type: errorData.type,
    message: errorData.message,
    path: errorData.path,
    userId: errorData.userId ? '[REDACTED]' : undefined, // Redact sensitive info in logs
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Implement actual error reporting service integration
  // Example: Sentry.captureException(error, { extra: errorData });
}

/**
 * Format error for client response
 * Ensures we don't leak sensitive information in error responses
 */
export function formatErrorResponse(error: Error, type: ErrorType, includeDetails = false): {
  error: string;
  message: string;
  details?: any;
} {
  // Basic error response for all environments
  const errorResponse = {
    error: type,
    message: getPublicErrorMessage(error, type),
  };
  
  // Only include details in development or if explicitly requested
  if ((process.env.NODE_ENV === 'development' || includeDetails) && error.stack) {
    return {
      ...errorResponse,
      details: error.stack,
    };
  }
  
  return errorResponse;
}

/**
 * Get a user-friendly error message that doesn't expose sensitive information
 */
function getPublicErrorMessage(error: Error, type: ErrorType): string {
  // In production, use generic messages for certain error types
  if (process.env.NODE_ENV === 'production') {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please sign in again.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.SERVER:
        return 'An unexpected error occurred. Our team has been notified.';
      case ErrorType.EXTERNAL_SERVICE:
        return 'We are experiencing issues with an external service. Please try again later.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please try again later.';
    }
  }
  
  // Return the actual error message (safe for validation errors in all environments)
  return error.message;
}

/**
 * Create a standardized error object
 */
export function createError(message: string, type: ErrorType, context?: Record<string, any>): Error {
  const error = new Error(message);
  (error as any).type = type;
  (error as any).context = context;
  return error;
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(error: any, path: string, userId?: string): {
  statusCode: number;
  response: any;
} {
  // Determine error type if not explicitly set
  const errorType = (error as any).type || ErrorType.SERVER;
  
  // Log the error
  logError({
    type: errorType,
    message: error.message || 'Unknown error',
    path,
    userId,
    stack: error.stack,
    context: (error as any).context,
  });
  
  // Determine appropriate status code
  let statusCode = 500;
  switch (errorType) {
    case ErrorType.VALIDATION:
      statusCode = 400;
      break;
    case ErrorType.AUTHENTICATION:
      statusCode = 401;
      break;
    case ErrorType.AUTHORIZATION:
      statusCode = 403;
      break;
    case ErrorType.NOT_FOUND:
      statusCode = 404;
      break;
    case ErrorType.RATE_LIMIT:
      statusCode = 429;
      break;
    default:
      statusCode = 500;
  }
  
  // Format the response
  return {
    statusCode,
    response: formatErrorResponse(error, errorType),
  };
} 