import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

/**
 * Middleware to validate request body against a schema.
 * Forwards validation errors to global error handler.
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next({ status: 400, message: "Validation failed", errors: err.errors });
      }
      next(err);
    }
  };
}

/**
 * Middleware to validate route params against a schema.
 */
export function validateParams<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next({ status: 400, message: "Invalid parameters", errors: err.errors });
      }
      next(err);
    }
  };
}