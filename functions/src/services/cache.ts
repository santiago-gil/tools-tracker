/**
 * Smart caching service with real-time invalidation
 */

import logger from '../utils/logger/index.js';
import type { Tool } from '../../../shared/schemas/index.js';
import type { User } from '../../../shared/schemas/index.js';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: number;
}

interface CacheConfig {
    ttl: number; // Time to live in milliseconds
    maxAge: number; // Maximum age before force refresh
}

class SmartCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private inFlightFetches = new Map<string, Promise<T>>();
    private config: CacheConfig;
    private globalVersion = 0;

    constructor(config: CacheConfig) {
        this.config = config;
    }

    /**
     * Get data from cache or fetch fresh
     */
    async get(
        key: string,
        fetcher: () => Promise<T>,
        forceRefresh = false
    ): Promise<T> {
        const now = Date.now();
        const cached = this.cache.get(key);

        // Force refresh if requested
        if (forceRefresh) {
            return await this.fetchAndCache(key, fetcher);
        }

        // Return cached data if fresh
        if (cached && this.isFresh(cached, now)) {
            const ageSeconds = ((now - cached.timestamp) / 1000).toFixed(1);
            logger.info({ key, ageSeconds, cacheHit: true }, `Cache HIT: ${key}`);
            return cached.data;
        }

        // Return stale data if not too old (background refresh)
        if (cached && this.isAcceptable(cached, now)) {
            const ageSeconds = ((now - cached.timestamp) / 1000).toFixed(1);
            logger.info({ key, ageSeconds, cacheHit: 'stale' }, `Cache STALE: ${key} (background refresh)`);
            // Trigger background refresh
            this.fetchAndCache(key, fetcher).catch((error: unknown) => {
                logger.error({ error, key }, 'Background cache refresh failed');
            });
            return cached.data;
        }

        // Fetch fresh data
        return await this.fetchAndCache(key, fetcher);
    }

    /**
     * Invalidate cache for specific key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
        this.globalVersion++;
    }

    /**
     * Invalidate all cache
     */
    invalidateAll(): void {
        this.cache.clear();
        this.globalVersion++;
    }

    /**
     * Check if cache entry is fresh
     */
    private isFresh(entry: CacheEntry<T>, now: number): boolean {
        return (now - entry.timestamp) < this.config.ttl;
    }

    /**
     * Check if cache entry is acceptable (stale but not too old)
     */
    private isAcceptable(entry: CacheEntry<T>, now: number): boolean {
        return (now - entry.timestamp) < this.config.maxAge;
    }

    /**
     * Fetch data and cache it
     */
    private async fetchAndCache(key: string, fetcher: () => Promise<T>): Promise<T> {
        // Check if there's already an in-flight fetch for this key
        const existingFetch = this.inFlightFetches.get(key);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = this.performFetch(key, fetcher);

        // Store the promise in inFlightFetches
        this.inFlightFetches.set(key, fetchPromise);

        try {
            return await fetchPromise;
        } finally {
            // Always remove from inFlightFetches when done
            this.inFlightFetches.delete(key);
        }
    }

    /**
     * Perform the actual fetch operation
     */
    private async performFetch(key: string, fetcher: () => Promise<T>): Promise<T> {
        const data = await fetcher();
        const now = Date.now();

        this.cache.set(key, {
            data,
            timestamp: now,
            version: this.globalVersion
        });

        return data;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            globalVersion: this.globalVersion,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Cache configurations for different data types
export const CACHE_CONFIGS = {
    // Tools cache: 2 minutes fresh, 10 minutes acceptable (stale-while-revalidate)
    // Phase 1 (0-2 min): Return cached, 0 reads
    // Phase 2 (2-10 min): Return stale immediately, 250 reads in background (non-blocking)
    // Phase 3 (10+ min): Must fetch fresh, 250 reads (blocking wait)
    // Tools are edited infrequently, safe to cache but keep fresh for real-time feel
    tools: {
        ttl: 2 * 60 * 1000, // 2 minutes (fresh period)
        maxAge: 10 * 60 * 1000 // 10 minutes (expiration)
    },

    // Users cache: 5 minutes fresh, 30 minutes acceptable  
    users: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
};

// Global cache instances
export const toolsCache = new SmartCache<Tool[]>(CACHE_CONFIGS.tools);
export const usersCache = new SmartCache<User[]>(CACHE_CONFIGS.users);
