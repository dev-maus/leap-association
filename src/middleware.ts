import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  // Allow inline scripts for Astro hydration and hCaptcha
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com https://challenges.cloudflare.com https://*.hcaptcha.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.hcaptcha.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob: https://*.hcaptcha.com",
    "connect-src 'self' https://*.supabase.co https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com",
    "frame-src 'self' https://js.hcaptcha.com https://challenges.cloudflare.com https://*.hcaptcha.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob: https://*.hcaptcha.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Only add upgrade-insecure-requests in production (not localhost)
    ...(import.meta.env.PROD ? ["upgrade-insecure-requests"] : []),
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Strict Transport Security (only in production with HTTPS)
  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return response;
};
