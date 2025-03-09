/**
 * Security monitoring utility
 * Tracks suspicious activities and provides alerting capabilities
 */

import { logError, ErrorType } from './error-handler';

// Types of security events to monitor
export enum SecurityEventType {
  FAILED_LOGIN = 'FAILED_LOGIN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DATA_EXPORT = 'DATA_EXPORT',
  ADMIN_ACTION = 'ADMIN_ACTION',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_DELETED = 'API_KEY_DELETED',
}

// Interface for security events
interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// In-memory store for recent security events (in production, use a database)
const recentEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000; // Limit the number of events stored in memory

/**
 * Log a security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Add to recent events (and remove oldest if at capacity)
  recentEvents.push(securityEvent);
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift();
  }

  // Log the event
  console.log('SECURITY EVENT:', {
    type: securityEvent.type,
    userId: securityEvent.userId,
    ip: securityEvent.ip,
    path: securityEvent.path,
    timestamp: securityEvent.timestamp.toISOString(),
  });

  // For critical events, also log as an error
  if (
    securityEvent.type === SecurityEventType.BRUTE_FORCE_ATTEMPT ||
    securityEvent.type === SecurityEventType.SUSPICIOUS_ACTIVITY
  ) {
    logError({
      type: ErrorType.AUTHENTICATION,
      message: `Security alert: ${securityEvent.type}`,
      userId: securityEvent.userId,
      path: securityEvent.path,
      context: {
        ip: securityEvent.ip,
        userAgent: securityEvent.userAgent,
        details: securityEvent.details,
      },
    });

    // In production, send alerts for critical events
    if (process.env.NODE_ENV === 'production') {
      sendSecurityAlert(securityEvent);
    }
  }
}

/**
 * Check for brute force attempts from an IP
 */
export function checkBruteForceAttempts(ip: string, timeWindowMs = 10 * 60 * 1000): boolean {
  const now = new Date();
  const cutoff = new Date(now.getTime() - timeWindowMs);

  // Count failed login attempts from this IP in the time window
  const recentFailedAttempts = recentEvents.filter(
    (event) =>
      event.type === SecurityEventType.FAILED_LOGIN &&
      event.ip === ip &&
      event.timestamp >= cutoff
  );

  // If more than 5 failed attempts in the time window, consider it a brute force attempt
  return recentFailedAttempts.length >= 5;
}

/**
 * Send a security alert (placeholder - implement with your preferred alerting system)
 */
function sendSecurityAlert(event: SecurityEvent): void {
  // In a real implementation, this would send an email, SMS, or notification
  // to security personnel or administrators
  console.warn('SECURITY ALERT:', {
    type: event.type,
    userId: event.userId,
    ip: event.ip,
    timestamp: event.timestamp.toISOString(),
    details: event.details,
  });

  // TODO: Implement actual alerting mechanism
  // Example: sendEmail('security@example.com', 'Security Alert', alertMessage);
}

/**
 * Get recent security events for a user
 */
export function getUserSecurityEvents(userId: string, limit = 10): SecurityEvent[] {
  return recentEvents
    .filter((event) => event.userId === userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Get recent security events by type
 */
export function getSecurityEventsByType(type: SecurityEventType, limit = 10): SecurityEvent[] {
  return recentEvents
    .filter((event) => event.type === type)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(userId: string, ip: string, userAgent?: string): void {
  logSecurityEvent({
    type: SecurityEventType.FAILED_LOGIN,
    userId,
    ip,
    userAgent,
  });

  // Check if this might be a brute force attempt
  if (checkBruteForceAttempts(ip)) {
    logSecurityEvent({
      type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
      ip,
      userAgent,
      details: {
        targetUserId: userId,
      },
    });
  }
} 