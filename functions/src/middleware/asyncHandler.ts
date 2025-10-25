/**
 * Async handler wrapper to catch errors in async route handlers
 * Prevents the need to manually call next(err) in every async route
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to automatically catch and forward errors
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json({ users });
 * }));
 */
export function asyncHandler<T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
    return (req: T, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

