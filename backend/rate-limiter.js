/**
 * Rate Limiter
 * Implements token bucket algorithm for rate limiting
 */
export class RateLimiter {
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 10; // Max requests per window
        this.windowMs = options.windowMs || 60000; // 1 minute window
        this.maxBurst = options.maxBurst || this.maxRequests * 2; // Burst capacity
        
        // Storage: Map<identifier, bucket>
        this.buckets = new Map();
        
        // Cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.windowMs);
    }

    /**
     * Check if request is allowed
     */
    async checkLimit(identifier) {
        const now = Date.now();
        let bucket = this.buckets.get(identifier);

        if (!bucket) {
            // Create new bucket
            bucket = {
                tokens: this.maxRequests - 1,
                lastRefill: now,
                requests: []
            };
            this.buckets.set(identifier, bucket);
            return { allowed: true, remaining: bucket.tokens };
        }

        // Refill tokens based on time passed
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(timePassed / this.windowMs * this.maxRequests);
        
        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(this.maxBurst, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }

        // Remove old requests outside window
        bucket.requests = bucket.requests.filter(
            timestamp => now - timestamp < this.windowMs
        );

        // Check if allowed
        if (bucket.tokens > 0) {
            bucket.tokens--;
            bucket.requests.push(now);
            return {
                allowed: true,
                remaining: bucket.tokens,
                resetAt: bucket.lastRefill + this.windowMs
            };
        }

        // Rate limited
        const oldestRequest = bucket.requests[0] || now;
        const resetAt = oldestRequest + this.windowMs;
        
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfter: Math.ceil((resetAt - now) / 1000)
        };
    }

    /**
     * Get current limit status for identifier
     */
    getStatus(identifier) {
        const bucket = this.buckets.get(identifier);
        if (!bucket) {
            return {
                tokens: this.maxRequests,
                requests: 0,
                maxRequests: this.maxRequests
            };
        }

        const now = Date.now();
        const activeRequests = bucket.requests.filter(
            timestamp => now - timestamp < this.windowMs
        ).length;

        return {
            tokens: bucket.tokens,
            requests: activeRequests,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs
        };
    }

    /**
     * Reset limit for identifier
     */
    reset(identifier) {
        this.buckets.delete(identifier);
    }

    /**
     * Cleanup old buckets
     */
    cleanup() {
        const now = Date.now();
        const staleThreshold = this.windowMs * 2;

        for (const [identifier, bucket] of this.buckets.entries()) {
            // Remove if no recent activity
            if (now - bucket.lastRefill > staleThreshold && bucket.requests.length === 0) {
                this.buckets.delete(identifier);
            }
        }
    }

    /**
     * Get all active limiters
     */
    getActiveLimiters() {
        return Array.from(this.buckets.entries()).map(([identifier, bucket]) => ({
            identifier,
            tokens: bucket.tokens,
            requests: bucket.requests.length,
            lastRefill: bucket.lastRefill
        }));
    }

    /**
     * Shutdown and cleanup
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.buckets.clear();
    }
}

/**
 * IP-based Rate Limiter
 */
export class IPRateLimiter extends RateLimiter {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Extract IP from request
     */
    getIdentifier(req) {
        return req.ip || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.connection.remoteAddress || 
               'unknown';
    }

    /**
     * Middleware for Express
     */
    middleware() {
        return async (req, res, next) => {
            const identifier = this.getIdentifier(req);
            const result = await this.checkLimit(identifier);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', this.maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
            
            if (result.resetAt) {
                res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
            }

            if (!result.allowed) {
                res.setHeader('Retry-After', result.retryAfter);
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }
}

/**
 * User-based Rate Limiter (for authenticated users)
 */
export class UserRateLimiter extends RateLimiter {
    constructor(options = {}) {
        super(options);
    }

    /**
     * Extract user ID from request
     */
    getIdentifier(req) {
        return req.user?.id || req.userId || 'anonymous';
    }

    /**
     * Middleware for Express
     */
    middleware() {
        return async (req, res, next) => {
            const identifier = this.getIdentifier(req);
            const result = await this.checkLimit(identifier);

            res.setHeader('X-RateLimit-Limit', this.maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
            
            if (result.resetAt) {
                res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
            }

            if (!result.allowed) {
                res.setHeader('Retry-After', result.retryAfter);
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
                    retryAfter: result.retryAfter
                });
            }

            next();
        };
    }
}
