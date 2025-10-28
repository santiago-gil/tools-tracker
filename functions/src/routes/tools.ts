import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { refreshRateLimit } from "../middleware/security.js";
import { checkOptimisticLock, type OptimisticLockRequest } from "../middleware/optimisticLocking.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { CreateToolSchema, UpdateToolSchema, idParamSchema, type CreateTool, type UpdateTool } from "../utils/validate.js";
import type { Tool } from '../../../shared/schemas/index.js';
import {
  getAllTools,
  deleteTool,
  getToolById,
} from "../services/index.js";
import { updateTool, addTool } from "../services/tools.js";
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

// Note: GET /tools/slug/:slug endpoint removed with Option C (nested paths)
// URLs are now /tools/:category/:tool with ?v=version query param

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

    const createdTool = await addTool(toolData, req);
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
  asyncHandler(async (req: OptimisticLockRequest, res) => {
    // The validation middleware has already validated the body
    const updateData = req.body as UpdateTool;

    logger.info(
      { uid: req.user?.uid, id: req.params.id },
      "PUT /tools/:id called"
    );

    const { id } = req.params;
    // The checkOptimisticLock middleware has already validated and parsed the version
    // and stored it in req.optimisticLock.expectedVersion
    if (!req.optimisticLock) {
      logger.error({ id }, 'Optimistic lock data missing after middleware');
      return res.status(400).json({
        success: false,
        error: 'Optimistic locking data missing. Please refresh and try again.',
        code: 'MISSING_LOCK_DATA'
      });
    }
    const versionNumber = req.optimisticLock.expectedVersion;

    const result = await updateTool(
      id,
      updateData,
      req,
      versionNumber
    );

    if (!result.success) {
      // Use structured error codes from service layer for type-safe error routing
      // Service returns { success: false, error, errorCode } for validation errors
      // or { success: false, error } for optimistic lock conflicts

      // Check for structured error codes first (preferred approach)
      if (result.errorCode === 'DUPLICATE_VERSION' || result.errorCode === 'FIELD_EXISTS') {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Fallback: type-safe string check for backwards compatibility
      // This guards against calling includes() on non-strings
      if (typeof result.error === 'string' && (
        result.error.includes('Duplicate version names') ||
        result.error.includes('already exists')
      )) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // All other errors are treated as optimistic lock conflicts (HTTP 409)
      return res.status(409).json({
        error: result.error,
        code: 'OPTIMISTIC_LOCK_CONFLICT',
        currentVersion: result.newVersion
      });
    }

    logger.info({ id, newVersion: result.newVersion }, "PUT /tools/:id success");

    // At this point, TypeScript guarantees result.success is true and result.tool exists
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