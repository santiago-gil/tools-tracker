import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/http.js";
import { getUserByUid } from "../services/users.js";
import logger from "../utils/logger/index.js";

// Cache user permissions to prevent timing attacks
const permissionCache = new Map<string, { permissions: Record<string, boolean>; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to invalidate permission cache when user permissions change
export function invalidatePermissionCache(uid: string) {
  permissionCache.delete(uid);
  logger.info({ uid }, "Permission cache invalidated");
}

export function requirePerm(
  action: "add" | "edit" | "delete" | "manageUsers"
) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next({ status: 401, message: "Unauthorized" });
    }

    // Check cache first to prevent timing attacks
    const cached = permissionCache.get(req.user.uid);
    const now = Date.now();

    let user: { permissions?: Record<string, boolean> } | null;
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached permissions
      user = { permissions: cached.permissions };
    } else {
      // Fetch fresh permissions and cache them
      user = await getUserByUid(req.user.uid);
      if (user?.permissions) {
        permissionCache.set(req.user.uid, {
          permissions: user.permissions,
          timestamp: now
        });
      }
    }

    if (!user?.permissions?.[action]) {
      logger.warn(
        { uid: req.user.uid, action },
        "Permission denied"
      );
      return next({
        status: 403,
        message: `Permission denied: ${action}`
      });
    }

    logger.debug(
      { uid: req.user.uid, action },
      "Permission granted"
    );

    return next();
  };
}