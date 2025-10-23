import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { toolSchema, idParamSchema } from "../utils/validate.js";
import {
  getTools,
  getAllTools,
  addTool,
  updateTool,
  deleteTool,
} from "../services/index.js";
import logger from "../utils/logger/index.js";
import { AuthedRequest } from "../types/http.js";

const router = Router();

router.use(authMiddleware);

/**
 * GET /tools
 * Get all tools (with caching)
 */
router.get("/", async (req: AuthedRequest, res, next) => {
  logger.info(
    { uid: req.user?.uid, role: req.user?.role },
    "GET /tools called"
  );
  try {
    const tools = await getTools();
    logger.info({ count: tools.length }, "GET /tools success");

    // Wrap in object
    res.json({ tools });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tools/refresh
 * Force refresh tools cache
 */
router.get("/refresh", async (req: AuthedRequest, res, next) => {
  logger.info(
    { uid: req.user?.uid, role: req.user?.role },
    "GET /tools/refresh called"
  );
  try {
    const tools = await getAllTools(true); // Force refresh
    logger.info({ count: tools.length }, "GET /tools/refresh success");

    res.json({
      tools,
      message: "Cache refreshed successfully"
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tools
 * Create a new tool
 */
router.post(
  "/",
  requirePerm("add"),
  validateBody(toolSchema),
  async (req: AuthedRequest, res, next) => {
    logger.info(
      { uid: req.user?.uid, platform: req.body.platform },
      "POST /tools called"
    );
    try {
      const id = await addTool(req.body);
      logger.info({ id }, "POST /tools success");

      // Return created resource
      res.status(201).json({
        success: true,
        id,
        message: "Tool created"
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /tools/:id
 * Update a tool
 */
router.put(
  "/:id",
  requirePerm("edit"),
  validateParams(idParamSchema),
  validateBody(toolSchema),
  async (req: AuthedRequest, res, next) => {
    logger.info(
      { uid: req.user?.uid, id: req.params.id },
      "PUT /tools/:id called"
    );
    try {
      const { id } = req.params;
      await updateTool(id, req.body);
      logger.info({ id }, "PUT /tools/:id success");

      // Return success message instead of 204
      res.json({
        success: true,
        message: "Tool updated"
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /tools/:id
 * Delete a tool
 */
router.delete(
  "/:id",
  requirePerm("delete"),
  validateParams(idParamSchema),
  async (req: AuthedRequest, res, next) => {
    logger.info(
      { uid: req.user?.uid, id: req.params.id },
      "DELETE /tools/:id called"
    );
    try {
      const { id } = req.params;
      await deleteTool(id);
      logger.info({ id }, "DELETE /tools/:id success");

      // Return success message
      res.json({
        success: true,
        message: "Tool deleted"
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;