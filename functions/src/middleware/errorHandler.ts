import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger/index.js";

export interface AppError extends Error {
  /** HTTP status code */
  status?: number;
  /** Message for the client */
  message: string;
  /** Optional validation errors (e.g. Zod) */
  errors?: unknown;
  /** Optional log message */
  log?: string;
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
  const status =
    (err as AppError)?.status && Number.isInteger((err as AppError).status)
      ? (err as AppError).status!
      : 500;

  const message =
    (err as AppError)?.message ||
    "An unknown error occurred. This is the global error handler";

  const errors = (err as AppError)?.errors;

  // Log full context (never crashes if err is not an object)
  logger.error(
    {
      path: req.originalUrl,
      method: req.method,
      status,
      err, // includes stack if present
    },
    (err as AppError)?.log || "Express error handler caught error"
  );

  // Respond JSON
  res.status(status).type("application/json").json({
    error: message,
    ...(errors ? { errors } : {}),
  });
}