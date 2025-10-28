/**
 * Backfill script to add normalizedName to all existing tools
 * Run this once to migrate existing tools to have the normalizedName field
 */

import { db } from './firebase.js';
import { normalizeName } from '@shared/schemas/stringUtils.js';
import logger from './logger/index.js';
import { COLLECTIONS } from '../config/collections.js';

export async function backfillNormalizedName(): Promise<void> {
    logger.info('Starting backfill of normalizedName field for all tools');

    const toolsCol = db.collection(COLLECTIONS.TOOLS);
    const snapshot = await toolsCol.get();

    if (snapshot.empty) {
        logger.info('No tools found to backfill');
        return;
    }

    logger.info({ count: snapshot.size }, 'Found tools to backfill');

    const batch = db.batch();
    let updateCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();

        // Only update tools that don't have normalizedName
        if (!data.normalizedName && data.name) {
            const normalizedName = normalizeName(data.name);
            batch.update(doc.ref, { normalizedName });
            updateCount++;
        }
    }

    if (updateCount > 0) {
        await batch.commit();
        logger.info({ updated: updateCount, total: snapshot.size }, 'Backfill completed');
    } else {
        logger.info('All tools already have normalizedName field');
    }
}

// Allow running this as a standalone script
if (require.main === module) {
    backfillNormalizedName()
        .then(() => {
            logger.info('Backfill script finished');
            process.exit(0);
        })
        .catch((error) => {
            logger.error({ error }, 'Backfill script failed');
            process.exit(1);
        });
}

