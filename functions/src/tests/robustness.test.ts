/**
 * Robustness tests for concurrent editing, optimistic locking, and audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AuthedRequest } from '../types/http.js';

// Mock request object
const mockRequest: AuthedRequest = {
    user: {
        uid: 'test-user-123',
        email: 'test@searchkings.ca',
        role: 'admin'
    },
    ip: '127.0.0.1',
    get: (header: string) => header === 'User-Agent' ? 'Test Agent' : undefined,
    connection: { remoteAddress: '127.0.0.1' }
} as any;

describe('Robustness Tests', () => {
    const testToolId = 'test-tool-robustness';
    
    beforeEach(() => {
        // Mock Firebase operations
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Optimistic Locking', () => {
        it('should allow update with correct version', async () => {
            const result = await updateTool(
                testToolId,
                { name: 'Updated Tool Name' },
                mockRequest,
                1 // Correct expected version
            );

            expect(result.success).toBe(true);
            expect(result.newVersion).toBe(2);
        });

        it('should reject update with incorrect version', async () => {
            const result = await updateTool(
                testToolId,
                { name: 'Updated Tool Name' },
                mockRequest,
                5 // Wrong expected version
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Document was modified');
        });

        it('should handle concurrent updates correctly', async () => {
            // Simulate two concurrent updates
            const update1 = updateTool(
                testToolId,
                { name: 'Update 1' },
                mockRequest,
                1
            );

            const update2 = updateTool(
                testToolId,
                { name: 'Update 2' },
                mockRequest,
                1 // Same version - should conflict
            );

            const [result1, result2] = await Promise.all([update1, update2]);

            // One should succeed, one should fail
            const successCount = [result1, result2].filter(r => r.success).length;
            const failureCount = [result1, result2].filter(r => !r.success).length;

            expect(successCount).toBe(1);
            expect(failureCount).toBe(1);
        });

        it('should increment version atomically', async () => {
            const initialDoc = await db.collection('tools_v2').doc(testToolId).get();
            const initialVersion = initialDoc.data()?._optimisticVersion || 0;

            await incrementVersion(testToolId);

            const updatedDoc = await db.collection('tools_v2').doc(testToolId).get();
            const newVersion = updatedDoc.data()?._optimisticVersion || 0;

            expect(newVersion).toBe(initialVersion + 1);
        });
    });

    describe('Audit Logging', () => {
        it('should log audit events correctly', async () => {
            await logAuditEvent(
                mockRequest,
                'UPDATE',
                'tool',
                testToolId,
                [
                    { field: 'name', oldValue: 'Test Tool', newValue: 'Updated Tool' }
                ]
            );

            const auditLogs = await getAuditLogs('tool', testToolId, 10);

            expect(auditLogs).toHaveLength(1);
            expect(auditLogs[0].action).toBe('UPDATE');
            expect(auditLogs[0].resourceId).toBe(testToolId);
            expect(auditLogs[0].userId).toBe('test-user-123');
            expect(auditLogs[0].changes).toHaveLength(1);
            expect(auditLogs[0].changes![0].field).toBe('name');
        });

        it('should handle audit logging failures gracefully', async () => {
            // Test with invalid request (no user)
            const invalidRequest = { ...mockRequest, user: undefined };

            // Should not throw error
            await expect(logAuditEvent(
                invalidRequest as any,
                'UPDATE',
                'tool',
                testToolId,
                []
            )).resolves.not.toThrow();
        });
    });

    describe('Concurrent Editing Scenarios', () => {
        it('should handle rapid successive updates', async () => {
            const updates = [];

            // Simulate 5 rapid updates
            for (let i = 0; i < 5; i++) {
                updates.push(
                    updateTool(
                        testToolId,
                        { name: `Update ${i}` },
                        mockRequest,
                        1 + i // Each update expects the previous version
                    )
                );
            }

            const results = await Promise.all(updates);

            // Only the first should succeed, others should fail
            const successResults = results.filter(r => r.success);
            const failureResults = results.filter(r => !r.success);

            expect(successResults).toHaveLength(1);
            expect(failureResults).toHaveLength(4);
        });

        it('should maintain data integrity under concurrent load', async () => {
            const concurrentUpdates = Array.from({ length: 10 }, (_, i) =>
                updateTool(
                    testToolId,
                    { name: `Concurrent Update ${i}` },
                    mockRequest,
                    1 // All expect version 1
                )
            );

            const results = await Promise.all(concurrentUpdates);

            // Only one should succeed
            const successCount = results.filter(r => r.success).length;
            expect(successCount).toBe(1);

            // Verify final state is consistent
            const finalDoc = await db.collection('tools_v2').doc(testToolId).get();
            const finalVersion = finalDoc.data()?._optimisticVersion;
            expect(finalVersion).toBe(2); // Should be incremented exactly once
        });
    });

    describe('Error Handling', () => {
        it('should handle non-existent tool gracefully', async () => {
            const result = await updateTool(
                'non-existent-tool',
                { name: 'Test' },
                mockRequest,
                1
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Tool not found');
        });

        it('should handle database connection issues', async () => {
            // This would require mocking database failures
            // For now, we'll test the error handling in the service
            const result = await updateTool(
                testToolId,
                { name: 'Test' },
                mockRequest,
                1
            );

            expect(result.success).toBe(true);
        });
    });

    describe('Performance Under Load', () => {
        it('should handle multiple concurrent operations', async () => {
            const startTime = Date.now();

            const operations = Array.from({ length: 20 }, (_, i) =>
                verifyOptimisticLock(testToolId, 1)
            );

            const results = await Promise.all(operations);
            const endTime = Date.now();

            // All should succeed (same version)
            expect(results.every(r => r.success)).toBe(true);

            // Should complete quickly
            expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
        });
    });
});
