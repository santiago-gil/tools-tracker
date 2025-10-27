import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { refreshRateLimit } from "../middleware/security.js";
import { checkOptimisticLock } from "../middleware/optimisticLocking.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { CreateToolSchema, UpdateToolSchema, idParamSchema, type CreateTool, type UpdateTool } from "../utils/validate.js";
import type { Tool } from '../../../shared/schemas/index.js';
import {
  getAllTools,
  deleteTool,
  getToolById,
} from "../services/index.js";
import { updateToolWithSlugs, addToolWithSlugs, findToolBySlugDB } from "../services/toolSlugService.js";
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
 * GET /tools/slug/:slug
 * Find tool by slug using database lookup (O(n*m) scan)
 * Note: Normal app flow uses O(1) client-side lookup via cached tools.
 * This endpoint is primarily for direct URL access or fallback scenarios.
 */
router.get("/slug/:slug", asyncHandler(async (req: AuthedRequest, res) => {
  const { slug } = req.params;

  logger.info(
    { uid: req.user?.uid, slug },
    "GET /tools/slug/:slug called"
  );

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Invalid slug parameter",
      code: 'INVALID_SLUG'
    });
  }

  try {
    const result = await findToolBySlugDB(slug);

    if (!result) {
      logger.info({ slug }, "Tool not found by slug");
      return res.status(404).json({
        success: false,
        error: "Tool not found",
        code: 'TOOL_NOT_FOUND'
      });
    }

    logger.info({ slug, toolId: result.tool.id }, "GET /tools/slug/:slug success");

    res.json({
      success: true,
      tool: result.tool,
      version: result.version
    });
  } catch (error) {
    logger.error({ slug, error }, "Error in slug lookup");
    res.status(500).json({
      success: false,
      error: "Internal server error",
      code: 'INTERNAL_ERROR'
    });
  }
}));

/**
 * GET /tools/:id
 * Get a single tool by ID (always fresh, bypasses cache for individual tool)
 */
router.get("/:id", validateParams(idParamSchema), asyncHandler(async (req: AuthedRequest, res) => {
  const { id } = req.params;

  logger.info(
    { uid: req.user?.uid, role: req.user?.role, id },
    "GET /tools/:id called"
  );

  const tool = await getToolById(id);

  if (!tool) {
    logger.warn({ id }, "Tool not found");
    return res.status(404).json({
      success: false,
      error: "Tool not found",
      code: 'TOOL_NOT_FOUND'
    });
  }

  logger.info({ id }, "GET /tools/:id success");
  res.json({ success: true, tool });
}));

/**
 * POST /tools
 * Create a new tool
 */
router.post(
  "/",
  requirePerm("add"),
  validateBody(CreateToolSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    // The validation middleware has already validated the body
    const toolData = req.body as CreateTool;

    logger.info(
      { uid: req.user?.uid ?? 'unknown', platform: toolData.name },
      "POST /tools called"
    );

    const createdTool = await addToolWithSlugs(toolData);
    const toolWithId = createdTool as Tool & { id: string };
    logger.info({ id: toolWithId.id }, "POST /tools success");

    // Return created resource with full tool data
    res.status(201).json({
      success: true,
      tool: toolWithId,
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
  validateBody(UpdateToolSchema),
  checkOptimisticLock,
  asyncHandler(async (req: AuthedRequest, res) => {
    // The validation middleware has already validated the body
    const updateData = req.body as UpdateTool;

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

    const result = await updateToolWithSlugs(
      id,
      updateData,
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

    if (!result.tool) {
      logger.error({ id }, "Tool update succeeded but no tool returned");
      return res.status(500).json({
        success: false,
        message: "Tool updated but failed to retrieve",
        error: "Internal server error"
      });
    }

    logger.info({ id, newVersion: result.newVersion }, "PUT /tools/:id success");

    // At this point, we know result.success is true and result.tool exists
    const updatedTool = result.tool as Tool & { id: string };

    res.json({
      success: true,
      tool: updatedTool,
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