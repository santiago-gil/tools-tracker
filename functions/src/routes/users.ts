import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateParams } from "../middleware/validate.js";
import { uidParamSchema } from "../utils/validate.js";
import {
  listUsers,
  getUserByUid,
  updateUser,
  deleteUser,
} from "../services/users.js";
import type { AuthedRequest } from "../types/http.js";

const router = Router();

// ✅ all user endpoints require authentication
router.use(authMiddleware);

/**
 * GET /users
 * Admin-only: list all users
 */
router.get("/", requirePerm("manageUsers"), async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/:uid
 * - Admins can fetch any user doc
 * - Non-admins can only fetch their own doc
 */
router.get(
  "/:uid",
  validateParams(uidParamSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { uid } = req.params;

      // Non-admins can only access their own doc
      if (req.user.role !== "admin" && req.user.uid !== uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userDoc = await getUserByUid(uid);
      if (!userDoc) return res.status(404).json({ error: "User not found" });

      res.json(userDoc);
    } catch (err) {
      next(err);
    }
  }
);

export default router;