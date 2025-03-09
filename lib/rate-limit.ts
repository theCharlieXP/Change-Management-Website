// Rate limiting implementation to protect API routes
export type RateLimitConfig = {
  interval: number; // in milliseconds
  limit: number;
};

// Simple in-memory store for rate limiting
// In production, consider using Redis or another distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getRateLimitConfig(
  type: 'default' | 'auth' | 'contact' = 'default'
): RateLimitConfig {
  switch (type) {
    case 'auth':
      return {
        interval: 60 * 1000, // 1 minute
        limit: 5, // 5 requests per minute
      };
    case 'contact':
      return {
        interval: 5 * 60 * 1000, // 5 minutes
        limit: 3, // 3 requests per 5 minutes
      };
    default:
      return {
        interval: 60 * 1000, // 1 minute
        limit: 60, // 60 requests per minute
      };
  }
}

export async function rateLimit(
  ip: string,
  config: RateLimitConfig = getRateLimitConfig()
): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
  const now = Date.now();
  const resetTime = now + config.interval;
  
  let record = rateLimitStore.get(ip);
  
  if (!record) {
    record = { count: 0, resetTime };
  }
  
  // Reset counter if the interval has passed
  if (now > record.resetTime) {
    record = { count: 0, resetTime };
  }
  
  // Increment counter
  record.count += 1;
  rateLimitStore.set(ip, record);
  
  const remaining = Math.max(0, config.limit - record.count);
  const success = record.count <= config.limit;
  
  return {
    success,
    limit: config.limit,
    remaining,
    reset: new Date(record.resetTime),
  };
} 