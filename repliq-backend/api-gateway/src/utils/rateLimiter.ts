// src/utils/rateLimiter.ts
// Placeholder for future rate limiting logic
// import rateLimit from 'express-rate-limit';

// export const rateLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 100, // limit each IP to 100 requests per windowMs
// });

export const rateLimiter = (_req: any, _res: any, next: any) => {
  // No-op for now
  next();
};
