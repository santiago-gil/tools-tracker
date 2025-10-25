/**
 * Utility functions for creating structured errors
 */

import type { AppError } from '../middleware/errorHandler.js';

/**
 * Create a structured error with context
 */
export function createError(
    message: string,
    status: number = 500,
    options: {
        code?: string;
        context?: AppError['context'];
        errors?: unknown;
        log?: string;
    } = {}
): AppError {
    const error = new Error(message) as AppError;
    error.status = status;
    if (options.code !== undefined) error.code = options.code;
    if (options.context !== undefined) error.context = options.context;
    if (options.errors !== undefined) error.errors = options.errors;
    if (options.log !== undefined) error.log = options.log;
    return error;
}

/**
 * Create a validation error
 */
export function createValidationError(
    message: string = 'Validation failed',
    errors: unknown[] = []
): AppError {
    return createError(message, 400, {
        code: 'VALIDATION_ERROR',
        errors,
        log: 'Validation error occurred'
    });
}

/**
 * Create an authentication error
 */
export function createAuthError(
    message: string = 'Authentication required',
    context?: AppError['context']
): AppError {
    return createError(message, 401, {
        code: 'AUTH_ERROR',
        context,
        log: 'Authentication error occurred'
    });
}

/**
 * Create an authorization error
 */
export function createForbiddenError(
    message: string = 'Insufficient permissions',
    context?: AppError['context']
): AppError {
    return createError(message, 403, {
        code: 'FORBIDDEN',
        context,
        log: 'Authorization error occurred'
    });
}

/**
 * Create a not found error
 */
export function createNotFoundError(
    resource: string = 'Resource',
    context?: AppError['context']
): AppError {
    return createError(`${resource} not found`, 404, {
        code: 'NOT_FOUND',
        context,
        log: `${resource} not found`
    });
}

/**
 * Create a conflict error (e.g., optimistic locking)
 */
export function createConflictError(
    message: string = 'Resource conflict',
    context?: AppError['context']
): AppError {
    return createError(message, 409, {
        code: 'CONFLICT',
        context,
        log: 'Resource conflict occurred'
    });
}

/**
 * Create a server error
 */
export function createServerError(
    message: string = 'Internal server error',
    context?: AppError['context']
): AppError {
    return createError(message, 500, {
        code: 'SERVER_ERROR',
        context,
        log: 'Server error occurred'
    });
}
