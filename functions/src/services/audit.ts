/**
 * Audit logging service for tracking all data changes
 */

import { db } from "../utils/firebase.js";
import logger from "../utils/logger/index.js";
import type { AuthedRequest } from "../types/http.js";
import { COLLECTIONS } from "../config/collections.js";

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: 'tool' | 'user';
    resourceId: string;
    changes?: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }[];
    metadata?: {
        ip?: string;
        userAgent?: string;
        requestId?: string;
    };
}

/**
 * Log an audit event to Firestore
 */
export async function logAuditEvent(
    req: AuthedRequest,
    action: AuditLog['action'],
    resource: AuditLog['resource'],
    resourceId: string,
    changes?: AuditLog['changes']
): Promise<void> {
    try {
        if (!req.user) {
            logger.warn('Attempted to log audit event without user context');
            return;
        }

        const auditLog: AuditLog = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            timestamp: new Date().toISOString(),
            userId: req.user.uid,
            userEmail: req.user.email ?? 'unknown',
            action,
            resource,
            resourceId,
            changes,
            metadata: {
                ip: req.ip ?? req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                requestId: req.get('X-Request-ID')
            }
        };

        // Store in Firestore
        await db.collection(COLLECTIONS.AUDIT_LOGS).doc(auditLog.id).set(auditLog);

        // Also log to console for immediate visibility
        logger.info({
            auditId: auditLog.id,
            userId: auditLog.userId,
            action: auditLog.action,
            resource: auditLog.resource,
            resourceId: auditLog.resourceId,
            changesCount: changes?.length ?? 0
        }, 'Audit event logged');

    } catch (error) {
        logger.error({ error, userId: req.user?.uid, action, resource, resourceId }, 'Failed to log audit event');
        // Don't throw - audit logging failure shouldn't break the main operation
    }
}

/**
 * Get audit logs for a specific resource
 */
export async function getAuditLogs(resource: string, resourceId: string, limit: number = 50): Promise<AuditLog[]> {
    try {
        const snapshot = await db
            .collection(COLLECTIONS.AUDIT_LOGS)
            .where('resource', '==', resource)
            .where('resourceId', '==', resourceId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
        logger.error({ error, resource, resourceId }, 'Failed to get audit logs');
        return [];
    }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    try {
        const snapshot = await db
            .collection(COLLECTIONS.AUDIT_LOGS)
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
        logger.error({ error, userId }, 'Failed to get user audit logs');
        return [];
    }
}
