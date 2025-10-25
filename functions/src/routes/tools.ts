import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { refreshRateLimit } from "../middleware/security.js";
import { checkOptimisticLock } from "../middleware/optimisticLocking.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { toolSchema, idParamSchema, type ToolInput } from "../utils/validate.js";
import {
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
router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  logger.info(
    { uid: req.user?.uid, role: req.user?.role },
    "GET /tools called"
  );

  const tools = await getAllTools();
  logger.info({ count: tools.length }, "GET /tools success");

  // Wrap in object
  res.json({ tools });
}));

/**
 * GET /tools/refresh
 * Force refresh tools cache (rate limited)
 */
router.get("/refresh", refreshRateLimit, asyncHandler(async (req: AuthedRequest, res) => {
  logger.info(
    { uid: req.user?.uid, role: req.user?.role },
    "GET /tools/refresh called"
  );

  const tools = await getAllTools(true); // Force refresh
  logger.info({ count: tools.length }, "GET /tools/refresh success");

  res.json({
    tools,
    message: "Cache refreshed successfully"
  });
}));

/**
 * POST /tools
 * Create a new tool
 */
router.post(
  "/",
  requirePerm("add"),
  validateBody(toolSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    logger.info(
      { uid: req.user?.uid, platform: (req.body as ToolInput).name },
      "POST /tools called"
    );

    const id = await addTool(req.body as ToolInput);
    logger.info({ id }, "POST /tools success");

    // Return created resource
    res.status(201).json({
      success: true,
      id,
      message: "Tool created"
    });
  })
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
  checkOptimisticLock,
  asyncHandler(async (req: AuthedRequest, res) => {
    logger.info(
      { uid: req.user?.uid, id: req.params.id },
      "PUT /tools/:id called"
    );

    const { id } = req.params;
    const expectedVersion = req.headers['x-expected-version'] as string;

    // Parse and validate version if provided
    let versionNumber: number | undefined;
    if (expectedVersion) {
      versionNumber = parseInt(expectedVersion, 10);
      if (isNaN(versionNumber) || versionNumber < 0) {
        return res.status(400).json({
          error: 'Invalid version format. Version must be a non-negative integer.',
          code: 'INVALID_VERSION_FORMAT'
        });
      }
    }

    const result = await updateTool(
      id,
      req.body as Partial<ToolInput>,
      req,
      versionNumber
    );

    if (!result.success) {
      return res.status(409).json({
        error: result.error,
        code: 'OPTIMISTIC_LOCK_CONFLICT',
        currentVersion: result.newVersion
      });
    }

    logger.info({ id, newVersion: result.newVersion }, "PUT /tools/:id success");

    res.json({
      success: true,
      message: "Tool updated",
      version: result.newVersion
    });
  })
);

/**
 * DELETE /tools/:id
 * Delete a tool
 */
router.delete(
  "/:id",
  requirePerm("delete"),
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    logger.info(
      { uid: req.user?.uid, id: req.params.id },
      "DELETE /tools/:id called"
    );

    const { id } = req.params;
    await deleteTool(id);
    logger.info({ id }, "DELETE /tools/:id success");

    // Return success message
    res.json({
      success: true,
      message: "Tool deleted"
    });
  })
);

export default router;