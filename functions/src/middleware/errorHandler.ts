import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/http.js";
import logger from "../utils/logger/index.js";
import { randomUUID } from "crypto";

export interface AppError extends Error {
  /** HTTP status code */
  status?: number;
  /** Message for the client */
  message: string;
  /** Optional validation errors (e.g. Zod) */
  errors?: unknown;
  /** Optional log message */
  log?: string;
  /** Request context for debugging */
  context?: {
    userId?: string;
    userRole?: string;
    requestId?: string;
    timestamp?: string;
  };
  /** Error code for client handling */
  code?: string;
}

/**
 * Global error handler: ensures every error response is JSON,
 * and logs structured error context with pino.
 */
export function errorHandler(
  err: AppError | Error | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Normalise error
  const appError = err as AppError;
  const status = appError.status && Number.isInteger(appError.status) && appError.status >= 100 && appError.status <= 599
    ? appError.status
    : 500;

  const message = appError.message ||
    "An unknown error occurred. This is the global error handler";

  const errors = appError.errors;
  const code = appError.code;
  const context = appError.context;

  // Enhanced logging with request context
  const logContext = {
    // Request details
    path: req.originalUrl,
    method: req.method,
    status,

    // User context (if available)
    userId: (req as AuthedRequest).user?.uid ?? context?.userId,
    userRole: (req as AuthedRequest).user?.role ?? context?.userRole,

    // Request metadata
    requestId: req.get('X-Request-ID') ?? context?.requestId ?? randomUUID(),
    userAgent: req.get('User-Agent'),
    ip: req.ip ?? req.socket.remoteAddress,

    // Error details
    errorCode: code,
    errorName: err instanceof Error ? err.name : 'UnknownError',
    timestamp: new Date().toISOString(),

    // Stack trace (only in development)
    ...(process.env.NODE_ENV !== 'production' && err instanceof Error && { stack: err.stack }),
  };

  // Log with appropriate level based on status
  if (status >= 500) {
    logger.error(logContext, appError.log ?? "Server error occurred");
  } else if (status >= 400) {
    logger.warn(logContext, appError.log ?? "Client error occurred");
  } else {
    logger.info(logContext, appError.log ?? "Error occurred");
  }

  // Respond JSON with enhanced error details
  const response: Record<string, unknown> = {
    error: message,
    ...(code ? { code } : {}),
    ...(errors ? { errors } : {}),
  };

  // Include request ID for tracking
  if (logContext.requestId) {
    response.requestId = logContext.requestId;
  }

  res.status(status).type("application/json").json(response);
}