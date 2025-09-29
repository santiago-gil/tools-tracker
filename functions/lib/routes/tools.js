import { Router } from "express";
import { authMiddleware, requirePerm } from "../middleware/index.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { toolSchema, idParamSchema } from "../utils/validate.js";
import { getTools, addTool, updateTool, deleteTool, } from "../services/index.js";
import logger from "../utils/logger/index.js";
const router = Router();
router.use(authMiddleware);
// GET tools
router.get("/", async (req, res, next) => {
    logger.info({ uid: req.user?.uid, email: req.user?.email }, "GET /tools called");
    try {
        const tools = await getTools();
        logger.info({ count: tools.length }, "GET /tools success");
        res.json(tools);
    }
    catch (err) {
        next(err);
    }
});
// CREATE tool
router.post("/", requirePerm("add"), validateBody(toolSchema), async (req, res, next) => {
    logger.info({ uid: req.user?.uid, body: req.body }, "POST /tools called");
    try {
        const id = await addTool(req.body);
        logger.info({ id }, "POST /tools success");
        res.status(201).json({ id });
    }
    catch (err) {
        next(err);
    }
});
// UPDATE tool
router.put("/:id", requirePerm("edit"), validateParams(idParamSchema), validateBody(toolSchema), async (req, res, next) => {
    logger.info({ uid: req.user?.uid, id: req.params.id, body: req.body }, "PUT /tools called");
    try {
        await updateTool(req.params.id, req.body);
        logger.info({ id: req.params.id }, "PUT /tools success");
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
// DELETE tool
router.delete("/:id", requirePerm("delete"), validateParams(idParamSchema), async (req, res, next) => {
    logger.info({ uid: req.user?.uid, id: req.params.id }, "DELETE /tools called");
    try {
        await deleteTool(req.params.id);
        logger.info({ id: req.params.id }, "DELETE /tools success");
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
export default router;
//# sourceMappingURL=tools.js.map