import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateParams, validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { uidParamSchema, UserUpdateSchema, type UserUpdate } from "../utils/validate.js";
import {
  listUsers,
  getUserByUid,
  updateUser,
  deleteUser,
} from "../services/users.js";
import type { AuthedRequest } from "../types/http.js";
import type { User } from '../../../shared/schemas/index.js';
import logger from "../utils/logger/index.js";

const router = Router();

// All user endpoints require authentication
router.use(authMiddleware);

/**
 * GET /users
 * Admin-only: list all users
 */
router.get("/", requirePerm("manageUsers"), asyncHandler(async (req: AuthedRequest, res) => {
  logger.info({ uid: req.user?.uid }, "GET /users called");

  const users = await listUsers();
  logger.info({ count: users.length }, "GET /users success");

  // Wrap in object for consistency
  res.json({ users });
}));

/**
 * GET /users/:uid
 * - Admins can fetch any user doc
 * - Non-admins can only fetch their own doc
 */
router.get(
  "/:uid",
  validateParams(uidParamSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    logger.info({
      uid: req.user?.uid,
      path: req.path,
      params: req.params,
      route: '/users/:uid'
    }, "GET /users/:uid called");

    if (!req.user) {
      logger.warn("GET /users/:uid - No user in request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { uid } = req.params;
    logger.info({ requestedUid: uid, requesterUid: req.user.uid, role: req.user.role }, "Processing user fetch request");

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
  })
);

/**
 * PUT /users/:uid
 * Admin-only: update user role/permissions
 */
router.put(
  "/:uid",
  requirePerm("manageUsers"),
  validateParams(uidParamSchema),
  validateBody(UserUpdateSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.user?.uid) {
      logger.error("Missing user context in authenticated request");
      return res.status(500).json({ error: "Internal server error" });
    }

    const { uid } = req.params;
    // req.body is now validated and typed by validateBody middleware
    const updateData = req.body as unknown as UserUpdate;

    logger.info(
      { uid, update: updateData, by: req.user.uid },
      "PUT /users/:uid called"
    );

    await updateUser(uid, updateData as Partial<Omit<User, "uid" | "createdAt">>, req.user.uid);
    logger.info({ uid }, "PUT /users/:uid success");

    // Return updated user - check if user still exists
    const updated = await getUserByUid(uid);
    if (!updated) {
      logger.error({ uid }, "User not found after update - this should not happen");
      return res.status(404).json({ error: "User not found" });
    }

    logger.info({ uid }, "PUT /users/:uid success - user updated");
    res.json({ user: updated });
  })
);

/**
 * DELETE /users/:uid
 * Admin-only: delete user
 */
router.delete(
  "/:uid",
  requirePerm("manageUsers"),
  validateParams(uidParamSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    logger.info(
      { uid: req.params.uid, by: req.user?.uid },
      "DELETE /users/:uid called"
    );

    const { uid } = req.params;
    await deleteUser(uid);
    logger.info({ uid }, "DELETE /users/:uid success");

    // Return success message
    res.json({ success: true, message: "User deleted" });
  })
);

export default router;