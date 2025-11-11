import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * Docker Layer Cache Manager
 * Manages Docker image layers for faster builds
 */
export class DockerLayerCache {
    constructor(options = {}) {
        this.imagePrefix = options.imagePrefix || 'zenith-cache';
        this.maxImages = options.maxImages || 50;
        
        // Cache statistics
        this.stats = {
            builds: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Image registry (in-memory)
        this.images = new Map();
    }

    /**
     * Initialize and load existing cached images
     */
    async initialize() {
        try {
            const { stdout } = await execAsync(`docker images ${this.imagePrefix}/* --format "{{.Repository}}:{{.Tag}}"`);
            const imageList = stdout.trim().split('\n').filter(Boolean);
            
            for (const image of imageList) {
                const [repo, tag] = image.split(':');
                this.images.set(tag, {
                    image,
                    createdAt: Date.now(),
                    usedAt: Date.now()
                });
            }
            
            console.log('✅ Docker layer cache initialized');
            console.log(`   Cached images: ${this.images.size}`);
        } catch (error) {
            console.error('❌ Failed to initialize Docker cache:', error.message);
        }
    }

    /**
     * Generate cache key for dependencies
     */
    generateCacheKey(dependencies) {
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(dependencies))
            .digest('hex');
        return hash.substring(0, 16);
    }

    /**
     * Check if cached image exists for dependencies
     */
    async getCachedImage(language, dependencies) {
        const cacheKey = this.generateCacheKey(dependencies);
        const imageName = `${this.imagePrefix}/${language}:${cacheKey}`;
        
        if (this.images.has(cacheKey)) {
            this.stats.cacheHits++;
            
            // Update usage time
            const entry = this.images.get(cacheKey);
            entry.usedAt = Date.now();
            
            return {
                hit: true,
                image: imageName,
                key: cacheKey
            };
        }
        
        this.stats.cacheMisses++;
        return {
            hit: false,
            image: imageName,
            key: cacheKey
        };
    }

    /**
     * Build and cache Docker image with dependencies
     */
    async buildCachedImage(language, baseImage, dependencies, workspacePath) {
        const cacheKey = this.generateCacheKey(dependencies);
        const imageName = `${this.imagePrefix}/${language}:${cacheKey}`;
        
        try {
            // Create Dockerfile for caching
            const dockerfile = this.generateDockerfile(language, baseImage, dependencies);
            
            // Build image
            console.log(`🔨 Building cached image: ${imageName}`);
            await execAsync(`docker build -t ${imageName} -f - ${workspacePath}`, {
                input: dockerfile
            });
            
            // Add to registry
            this.images.set(cacheKey, {
                image: imageName,
                createdAt: Date.now(),
                usedAt: Date.now()
            });
            
            this.stats.builds++;
            
            // Enforce quota
            await this.enforceQuota();
            
            return {
                success: true,
                image: imageName,
                key: cacheKey
            };
        } catch (error) {
            console.error('Failed to build cached image:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate Dockerfile for dependency caching
     */
    generateDockerfile(language, baseImage, dependencies) {
        switch (language) {
            case 'node':
                return `
FROM ${baseImage}
WORKDIR /workspace
COPY package*.json ./
RUN npm ci --only=production || npm install
`;

            case 'python':
                return `
FROM ${baseImage}
WORKDIR /workspace
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
`;

            default:
                return `FROM ${baseImage}`;
        }
    }

    /**
     * Enforce image quota (remove oldest unused images)
     */
    async enforceQuota() {
        if (this.images.size <= this.maxImages) return;
        
        // Sort by usage time (oldest first)
        const sortedImages = Array.from(this.images.entries())
            .sort((a, b) => a[1].usedAt - b[1].usedAt);
        
        // Remove oldest images
        const toRemove = sortedImages.slice(0, this.images.size - this.maxImages);
        
        for (const [key, entry] of toRemove) {
            try {
                await execAsync(`docker rmi ${entry.image}`);
                this.images.delete(key);
                console.log(`🗑️  Removed cached image: ${entry.image}`);
            } catch (error) {
                console.error(`Failed to remove image ${entry.image}:`, error.message);
            }
        }
    }

    /**
     * Clean unused images
     */
    async cleanUnusedImages(maxAge = 7 * 24 * 60 * 60 * 1000) {
        const now = Date.now();
        const toRemove = [];
        
        for (const [key, entry] of this.images.entries()) {
            if (now - entry.usedAt > maxAge) {
                toRemove.push([key, entry]);
            }
        }
        
        for (const [key, entry] of toRemove) {
            try {
                await execAsync(`docker rmi ${entry.image}`);
                this.images.delete(key);
                console.log(`🗑️  Cleaned unused image: ${entry.image}`);
            } catch (error) {
                console.error(`Failed to clean image ${entry.image}:`, error.message);
            }
        }
        
        return toRemove.length;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.cacheHits + this.stats.cacheMisses > 0
            ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            cachedImages: this.images.size,
            maxImages: this.maxImages
        };
    }

    /**
     * Clear all cached images
     */
    async clearCache() {
        try {
            await execAsync(`docker rmi $(docker images ${this.imagePrefix}/* -q) 2>/dev/null || true`);
            this.images.clear();
            this.stats = {
                builds: 0,
                cacheHits: 0,
                cacheMisses: 0
            };
            console.log('✅ Docker layer cache cleared');
        } catch (error) {
            console.error('Failed to clear Docker cache:', error.message);
        }
    }
}
