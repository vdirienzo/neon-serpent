/**
 * @fileoverview Vite preview server middleware that adds proper security
 * headers (frame-ancestors, X-Frame-Options). GitHub Pages does NOT
 * support custom HTTP headers, so this only works for `vite preview` /
 * local dev. For production deploys, see the migration path below.
 */

import type { Connect, Plugin } from 'vite';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()',
  // frame-ancestors CANNOT be set in a <meta> tag, so it MUST be HTTP header
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://unpkg.com; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests",
};

function applyHeaders(
  _req: Connect.IncomingMessage,
  res: Connect.ServerResponse,
  next: Connect.NextFunction
): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
}

export function securityHeadersPlugin(): Plugin {
  return {
    name: 'security-headers',
    configurePreviewServer(server) {
      return () => {
        server.middlewares.use(applyHeaders);
      };
    },
    configureServer(server) {
      return () => {
        server.middlewares.use(applyHeaders);
      };
    },
  };
}

