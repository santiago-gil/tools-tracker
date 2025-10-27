import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import logger from "../utils/logger/index.js";

/**
 * Typed request interface that extends Express Request with typed body
 */
interface TypedRequest<T> extends Request {
  body: T;
}

/**
 * Typed request interface that extends Express Request with typed params
 * Note: We use a different property name to avoid conflicts with Express's built-in params
 */
interface TypedRequestParams<T> extends Request {
  validatedParams: T;
}

/**
 * Middleware to validate request body against a schema.
 * Forwards validation errors to global error handler.
 */
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Safely handle req.body as unknown, with runtime checks
    const isObject = typeof req.body === 'object' && req.body !== null;
    const safeBody = isObject ? req.body as Record<string, unknown> : {};

    // Log non-sensitive request metadata only
    logger.debug({
      path: req.path,
      method: req.method,
      bodyKeys: Object.keys(safeBody),
      hasVersions: Array.isArray(safeBody.versions),
      versionsCount: Array.isArray(safeBody.versions) ? safeBody.versions.length : undefined
    }, '[validateBody] Validating request body');

    const result = schema.safeParse(req.body);

    // Log validation result without sensitive error details
    logger.debug({
      success: result.success,
      errorCount: result.success ? 0 : result.error.issues.length
    }, '[validateBody] Validation result');

    if (!result.success) {
      // Format the most user-friendly error message from Zod issues
      const hasIssues = Array.isArray(result.error.issues) && result.error.issues.length > 0;
      const firstIssue = hasIssues ? result.error.issues[0] : null;
      const errorMessage = firstIssue?.message ?? "Validation failed";

      return next({
        status: 400,
        message: errorMessage,
        errors: result.error.issues
      });
    }

    (req as TypedRequest<z.infer<T>>).body = result.data as z.infer<T>;
    next();
  };
}

/**
 * Middleware to validate route params against a schema.
 */
export function validateParams<T extends z.ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      // Format the most user-friendly error message from Zod issues
      const hasIssues = Array.isArray(result.error.issues) && result.error.issues.length > 0;
      const firstIssue = hasIssues ? result.error.issues[0] : null;
      const errorMessage = firstIssue?.message ?? "Validation failed";

      return next({
        status: 400,
        message: errorMessage,
        errors: result.error.issues
      });
    }
    (req as TypedRequestParams<z.infer<T>>).validatedParams = result.data as z.infer<T>;
    next();
  };
}