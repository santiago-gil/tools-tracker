/**
 * Optimistic locking middleware for concurrent editing protection
 */

import { db } from "../utils/firebase.js";
import logger from "../utils/logger/index.js";
import type { AuthedRequest } from "../types/http.js";
import type { Response, NextFunction } from "express";
import { COLLECTIONS } from "../config/collections.js";

export interface OptimisticLockRequest extends AuthedRequest {
    optimisticLock?: {
        expectedVersion: number;
        currentVersion: number;
    };
}

/**
 * Middleware to check optimistic locking for tool updates
 */
export function checkOptimisticLock(req: OptimisticLockRequest, res: Response, next: NextFunction) {
    // Only apply to PUT requests for tools
    if (req.method !== 'PUT' || !req.params.id) {
        return next();
    }

    const expectedVersion = req.headers['x-expected-version'] as string;
    if (!expectedVersion) {
        logger.warn({ toolId: req.params.id, userId: req.user?.uid }, 'Update request without version header');
        return res.status(400).json({
            error: 'Optimistic locking required. Please refresh and try again.',
            code: 'MISSING_VERSION_HEADER'
        });
    }

    // Validate that the version is a valid integer
    const versionNumber = parseInt(expectedVersion, 10);
    if (isNaN(versionNumber) || versionNumber < 0) {
        logger.warn({ toolId: req.params.id, userId: req.user?.uid, expectedVersion }, 'Invalid version header format');
        return res.status(400).json({
            error: 'Invalid version format. Version must be a non-negative integer.',
            code: 'INVALID_VERSION_FORMAT'
        });
    }

    // Store the expected version for use in the route handler
    req.optimisticLock = {
        expectedVersion: versionNumber,
        currentVersion: 0 // Will be set by the route handler
    };

    next();
}

/**
 * Verify optimistic lock before updating a tool
 */
export async function verifyOptimisticLock(
    toolId: string,
    expectedVersion: number
): Promise<{ success: boolean; currentVersion?: number; error?: string }> {
    try {
        const toolDoc = await db.collection(COLLECTIONS.TOOLS).doc(toolId).get();

        if (!toolDoc.exists) {
            return { success: false, error: 'Tool not found' };
        }

        const toolData = toolDoc.data() as { _optimisticVersion?: number };
        let currentVersion = toolData._optimisticVersion;

        // If tool doesn't have _optimisticVersion, initialize it to 0
        if (currentVersion === undefined) {
            logger.info({ toolId }, 'Tool missing _optimisticVersion, initializing to 0');
            await toolDoc.ref.update({ _optimisticVersion: 0 });
            currentVersion = 0;
        }

        if (currentVersion !== expectedVersion) {
            logger.warn({
                toolId,
                expectedVersion,
                currentVersion
            }, 'Optimistic lock conflict detected');

            return {
                success: false,
                currentVersion,
                error: 'Document was modified by another user. Please refresh and try again.'
            };
        }

        return { success: true, currentVersion };
    } catch (error) {
        logger.error({ error, toolId, expectedVersion }, 'Failed to verify optimistic lock');
        return { success: false, error: 'Failed to verify document version' };
    }
}

/**
 * Increment version number after successful update
 */
export async function incrementVersion(toolId: string): Promise<number> {
    try {
        const toolRef = db.collection(COLLECTIONS.TOOLS).doc(toolId);
        const newVersion = await db.runTransaction(async (transaction) => {
            const toolDoc = await transaction.get(toolRef);

            if (!toolDoc.exists) {
                throw new Error('Tool not found');
            }

            const toolData = toolDoc.data() as { _optimisticVersion?: number };
            const currentVersion = toolData._optimisticVersion ?? 0;
            const newVersion = currentVersion + 1;

            transaction.update(toolRef, { _optimisticVersion: newVersion });
            return newVersion;
        });

        logger.info({ toolId, newVersion }, 'Version incremented successfully');
        return newVersion;
    } catch (error) {
        logger.error({ error, toolId }, 'Failed to increment version');
        throw error;
    }
}
