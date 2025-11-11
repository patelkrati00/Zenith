import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cache Manager for Dependencies
 * Caches npm packages, pip packages, and compiled binaries
 */
export class CacheManager {
    constructor(options = {}) {
        this.cacheDir = options.cacheDir || '/tmp/ide-cache';
        this.maxCacheSize = options.maxCacheSize || 1024 * 1024 * 1024; // 1GB
        this.maxCacheAge = options.maxCacheAge || 7 * 24 * 60 * 60 * 1000; // 7 days
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0
        };
        
        // Cache index (in-memory for fast lookup)
        this.index = new Map();
    }

    /**
     * Initialize cache directory and load index
     */
    async initialize() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.mkdir(path.join(this.cacheDir, 'npm'), { recursive: true });
            await fs.mkdir(path.join(this.cacheDir, 'pip'), { recursive: true });
            await fs.mkdir(path.join(this.cacheDir, 'compiled'), { recursive: true });
            
            // Load existing cache index
            await this.loadIndex();
            
            console.log('✅ Cache manager initialized');
            console.log(`   Cache directory: ${this.cacheDir}`);
            console.log(`   Cached items: ${this.index.size}`);
        } catch (error) {
            console.error('❌ Failed to initialize cache:', error.message);
        }
    }

    /**
     * Generate cache key from content
     */
    generateKey(content, type = 'generic') {
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        return `${type}-${hash.substring(0, 16)}`;
    }

    /**
     * Get cached npm dependencies
     */
    async getNpmCache(packageJson) {
        const key = this.generateKey(packageJson, 'npm');
        const cachePath = path.join(this.cacheDir, 'npm', key);
        
        try {
            await fs.access(cachePath);
            this.stats.hits++;
            
            // Update access time
            await this.updateAccessTime(key);
            
            return {
                hit: true,
                path: cachePath,
                key
            };
        } catch {
            this.stats.misses++;
            return {
                hit: false,
                path: cachePath,
                key
            };
        }
    }

    /**
     * Cache npm dependencies
     */
    async cacheNpmDependencies(packageJson, nodeModulesPath) {
        const key = this.generateKey(packageJson, 'npm');
        const cachePath = path.join(this.cacheDir, 'npm', key);
        
        try {
            // Copy node_modules to cache
            await this.copyDirectory(nodeModulesPath, cachePath);
            
            // Update index
            const stat = await fs.stat(cachePath);
            this.index.set(key, {
                type: 'npm',
                path: cachePath,
                size: await this.getDirectorySize(cachePath),
                createdAt: Date.now(),
                accessedAt: Date.now()
            });
            
            await this.saveIndex();
            await this.enforceQuota();
            
            return { success: true, key };
        } catch (error) {
            console.error('Failed to cache npm dependencies:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cached pip dependencies
     */
    async getPipCache(requirementsTxt) {
        const key = this.generateKey(requirementsTxt, 'pip');
        const cachePath = path.join(this.cacheDir, 'pip', key);
        
        try {
            await fs.access(cachePath);
            this.stats.hits++;
            
            await this.updateAccessTime(key);
            
            return {
                hit: true,
                path: cachePath,
                key
            };
        } catch {
            this.stats.misses++;
            return {
                hit: false,
                path: cachePath,
                key
            };
        }
    }

    /**
     * Cache pip dependencies
     */
    async cachePipDependencies(requirementsTxt, venvPath) {
        const key = this.generateKey(requirementsTxt, 'pip');
        const cachePath = path.join(this.cacheDir, 'pip', key);
        
        try {
            // Copy venv to cache
            await this.copyDirectory(venvPath, cachePath);
            
            // Update index
            this.index.set(key, {
                type: 'pip',
                path: cachePath,
                size: await this.getDirectorySize(cachePath),
                createdAt: Date.now(),
                accessedAt: Date.now()
            });
            
            await this.saveIndex();
            await this.enforceQuota();
            
            return { success: true, key };
        } catch (error) {
            console.error('Failed to cache pip dependencies:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cached compiled binary
     */
    async getCompiledCache(sourceCode, language) {
        const key = this.generateKey(sourceCode, `compiled-${language}`);
        const cachePath = path.join(this.cacheDir, 'compiled', key);
        
        try {
            await fs.access(cachePath);
            this.stats.hits++;
            
            await this.updateAccessTime(key);
            
            return {
                hit: true,
                path: cachePath,
                key
            };
        } catch {
            this.stats.misses++;
            return {
                hit: false,
                path: cachePath,
                key
            };
        }
    }

    /**
     * Cache compiled binary
     */
    async cacheCompiledBinary(sourceCode, language, binaryPath) {
        const key = this.generateKey(sourceCode, `compiled-${language}`);
        const cachePath = path.join(this.cacheDir, 'compiled', key);
        
        try {
            // Copy binary to cache
            await fs.copyFile(binaryPath, cachePath);
            await fs.chmod(cachePath, 0o755);
            
            // Update index
            const stat = await fs.stat(cachePath);
            this.index.set(key, {
                type: 'compiled',
                language,
                path: cachePath,
                size: stat.size,
                createdAt: Date.now(),
                accessedAt: Date.now()
            });
            
            await this.saveIndex();
            await this.enforceQuota();
            
            return { success: true, key };
        } catch (error) {
            console.error('Failed to cache compiled binary:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Copy directory recursively
     */
    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * Get directory size
     */
    async getDirectorySize(dirPath) {
        let size = 0;
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    size += await this.getDirectorySize(fullPath);
                } else {
                    const stat = await fs.stat(fullPath);
                    size += stat.size;
                }
            }
        } catch (error) {
            // Ignore errors
        }
        
        return size;
    }

    /**
     * Update access time for cache entry
     */
    async updateAccessTime(key) {
        const entry = this.index.get(key);
        if (entry) {
            entry.accessedAt = Date.now();
            await this.saveIndex();
        }
    }

    /**
     * Enforce cache quota (LRU eviction)
     */
    async enforceQuota() {
        // Calculate total cache size
        let totalSize = 0;
        for (const entry of this.index.values()) {
            totalSize += entry.size;
        }
        
        this.stats.totalSize = totalSize;
        
        // If over quota, evict least recently used
        if (totalSize > this.maxCacheSize) {
            const entries = Array.from(this.index.entries())
                .sort((a, b) => a[1].accessedAt - b[1].accessedAt);
            
            for (const [key, entry] of entries) {
                if (totalSize <= this.maxCacheSize * 0.8) break; // Keep 80% of quota
                
                try {
                    // Remove from filesystem
                    if (entry.type === 'compiled') {
                        await fs.unlink(entry.path);
                    } else {
                        await fs.rm(entry.path, { recursive: true, force: true });
                    }
                    
                    // Remove from index
                    this.index.delete(key);
                    totalSize -= entry.size;
                    this.stats.evictions++;
                    
                    console.log(`🗑️  Evicted cache entry: ${key}`);
                } catch (error) {
                    console.error(`Failed to evict ${key}:`, error.message);
                }
            }
            
            await this.saveIndex();
        }
    }

    /**
     * Clean old cache entries
     */
    async cleanOldEntries() {
        const now = Date.now();
        const entriesToRemove = [];
        
        for (const [key, entry] of this.index.entries()) {
            if (now - entry.accessedAt > this.maxCacheAge) {
                entriesToRemove.push(key);
            }
        }
        
        for (const key of entriesToRemove) {
            const entry = this.index.get(key);
            
            try {
                if (entry.type === 'compiled') {
                    await fs.unlink(entry.path);
                } else {
                    await fs.rm(entry.path, { recursive: true, force: true });
                }
                
                this.index.delete(key);
                this.stats.evictions++;
                
                console.log(`🗑️  Cleaned old cache entry: ${key}`);
            } catch (error) {
                console.error(`Failed to clean ${key}:`, error.message);
            }
        }
        
        if (entriesToRemove.length > 0) {
            await this.saveIndex();
        }
    }

    /**
     * Load cache index from disk
     */
    async loadIndex() {
        const indexPath = path.join(this.cacheDir, 'index.json');
        
        try {
            const data = await fs.readFile(indexPath, 'utf8');
            const indexData = JSON.parse(data);
            
            this.index = new Map(Object.entries(indexData.entries || {}));
            this.stats = indexData.stats || this.stats;
        } catch {
            // Index doesn't exist yet, that's okay
        }
    }

    /**
     * Save cache index to disk
     */
    async saveIndex() {
        const indexPath = path.join(this.cacheDir, 'index.json');
        
        const indexData = {
            entries: Object.fromEntries(this.index),
            stats: this.stats,
            updatedAt: Date.now()
        };
        
        try {
            await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
        } catch (error) {
            console.error('Failed to save cache index:', error.message);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            cacheSize: this.formatBytes(this.stats.totalSize),
            maxSize: this.formatBytes(this.maxCacheSize),
            entries: this.index.size
        };
    }

    /**
     * Format bytes to human-readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Clear entire cache
     */
    async clearCache() {
        try {
            await fs.rm(this.cacheDir, { recursive: true, force: true });
            await this.initialize();
            
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                totalSize: 0
            };
            
            console.log('✅ Cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error.message);
        }
    }
}
