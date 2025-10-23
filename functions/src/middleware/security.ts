/**
 * Security middleware for production
 */

import type { Request, Response, NextFunction } from "express";

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent XSS attacks
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // React needs unsafe-inline
        "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.googleapis.com https://*.firebase.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ].join('; '));

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function rateLimit(req: Request, res: Response, next: NextFunction) {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
        // Reset or initialize
        requestCounts.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
        return next();
    }

    if (clientData.count >= RATE_LIMIT) {
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
    }

    clientData.count++;
    next();
}

/**
 * Request size limiting
 */
export function requestSizeLimit(req: Request, res: Response, next: NextFunction) {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const MAX_SIZE = 1024 * 1024; // 1MB

    if (contentLength > MAX_SIZE) {
        return res.status(413).json({ error: 'Request entity too large' });
    }

    next();
}

/**
 * CORS configuration
 */
export function corsConfig(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://your-domain.com', // Replace with your actual domain
        'http://localhost:3000',    // Development
        'http://localhost:5002'     // Firebase emulator
    ];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
}
