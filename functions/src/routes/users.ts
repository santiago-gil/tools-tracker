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
import logger from "../utils/logger/index.js";

const router = Router();

// All user endpoints require authentication
router.use(authMiddleware);

/**
 * GET /users
 * Admin-only: list all users
 */
router.get("/", requirePerm("manageUsers"), async (req: AuthedRequest, res, next) => {
  logger.info({ uid: req.user?.uid }, "GET /users called");
  try {
    const users = await listUsers();
    logger.info({ count: users.length }, "GET /users success");

    // Wrap in object for consistency
    res.json({ users });
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

      // req.user.role is now populated by authMiddleware
      if (req.user.role !== "admin" && req.user.uid !== uid) {
        logger.warn(
          { requester: req.user.uid, target: uid },
          "Forbidden user access"
        );
        return res.status(403).json({ error: "Forbidden" });
      }

      const userDoc = await getUserByUid(uid);

      if (!userDoc) {
        logger.warn({ uid }, "User document not found");
        return res.status(404).json({ error: "User not found" });
      }

      logger.info({ uid }, "GET /users/:uid success");

      // Wrap in object
      res.json({ user: userDoc });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /users/:uid
 * Admin-only: update user role/permissions
 */
router.put(
  "/:uid",
  requirePerm("manageUsers"),
  validateParams(uidParamSchema),
  async (req: AuthedRequest, res, next) => {
    logger.info(
      { uid: req.params.uid, update: req.body, by: req.user?.uid },
      "PUT /users/:uid called"
    );
    try {
      const { uid } = req.params;
      await updateUser(uid, req.body);
      logger.info({ uid }, "PUT /users/:uid success");

      // Return updated user
      const updated = await getUserByUid(uid);
      res.json({ user: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /users/:uid
 * Admin-only: delete user
 */
router.delete(
  "/:uid",
  requirePerm("manageUsers"),
  validateParams(uidParamSchema),
  async (req: AuthedRequest, res, next) => {
    logger.info(
      { uid: req.params.uid, by: req.user?.uid },
      "DELETE /users/:uid called"
    );
    try {
      const { uid } = req.params;
      await deleteUser(uid);
      logger.info({ uid }, "DELETE /users/:uid success");

      // Return success message
      res.json({ success: true, message: "User deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;