import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '../../shared/types.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

const createRateLimiter = ({ windowMs, max }: RateLimitOptions) => {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (hits.get(key) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );

    if (recent.length >= max) {
      const body: ApiError = {
        error: 'rate_limited',
        message: `Too many requests. Limit ${max} per ${Math.round(windowMs / 1000)}s.`,
      };
      res.status(429).json(body);
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
};

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const requireJsonBody = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!BODY_METHODS.has(req.method)) {
    next();
    return;
  }
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    const body: ApiError = {
      error: 'unsupported_media_type',
      message: 'Content-Type must be application/json.',
    };
    res.status(415).json(body);
    return;
  }
  next();
};

export { createRateLimiter, requireJsonBody };
