import { db } from "../utils/firebase.js";
import logger from "../utils/logger/index.js";
const toolsCol = db.collection("tools");
/**
 * Get all tools
 */
export async function getTools() {
    logger.info("Fetching all tools");
    const snap = await toolsCol.get();
    logger.info({ count: snap.size }, "Fetched tools collection");
    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
}
/**
 * Add a new tool
 */
export async function addTool(data) {
    logger.info({ data }, "Adding new tool");
    const docRef = await toolsCol.add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    logger.info({ id: docRef.id }, "Tool created");
    return docRef.id;
}
/**
 * Update a tool
 */
export async function updateTool(id, data) {
    logger.info({ id, update: data }, "Updating tool");
    await toolsCol.doc(id).update({
        ...data,
        updatedAt: new Date(),
    });
    logger.info({ id }, "Tool updated");
}
/**
 * Delete a tool
 */
export async function deleteTool(id) {
    logger.info({ id }, "Deleting tool");
    await toolsCol.doc(id).delete();
    logger.info({ id }, "Tool deleted");
}
//# sourceMappingURL=tools.js.map