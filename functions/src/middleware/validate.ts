import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

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
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next({ status: 400, message: "Validation failed", errors: result.error.errors });
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
      return next({ status: 400, message: "Invalid parameters", errors: result.error.errors });
    }
    (req as TypedRequestParams<z.infer<T>>).validatedParams = result.data as z.infer<T>;
    next();
  };
}