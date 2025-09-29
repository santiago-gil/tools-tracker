import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../types/http.js";
import { getUserByUid } from "../services/users.js";

export function requirePerm(
  action: "add" | "edit" | "delete" | "manageUsers"
) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next({ status: 401, message: "Unauthorized" });
    }

    const user = await getUserByUid(req.user.uid);

    if (!user?.permissions?.[action]) {
      return next({ status: 403, message: `Not permitted: ${action}` });
    }

    return next();
  };
}