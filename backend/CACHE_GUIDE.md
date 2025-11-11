# Cache System Quick Reference

## 🚀 Quick Start

```bash
# Start server with caching enabled
npm start

# Test cache system
node test-cache.js
```

## 📊 Monitor Cache

### Get Cache Statistics
```bash
curl http://localhost:3001/cache/stats
```

### Response
```json
{
  "dependencyCache": {
    "hits": 15,
    "misses": 8,
    "hitRate": "65.22%",
    "cacheSize": "245.67 MB",
    "entries": 23
  },
  "dockerLayerCache": {
    "cacheHits": 12,
    "cacheMisses": 5,
    "hitRate": "70.59%",
    "cachedImages": 5
  }
}
```

## 🗑️ Clear Cache

```bash
curl -X DELETE http://localhost:3001/cache/clear
```

## ⚙️ Configuration

Edit `.env`:
```env
CACHE_DIR=/tmp/ide-cache              # Where cache is stored
MAX_CACHE_SIZE=1073741824             # 1GB max size
MAX_CACHE_AGE=604800000               # 7 days max age
MAX_CACHED_IMAGES=50                  # Max Docker images
```

## 📈 What Gets Cached

| Type | Cache Key | Speedup |
|------|-----------|---------|
| npm packages | package.json hash | 5-30x |
| pip packages | requirements.txt hash | 5-20x |
| C/C++ binaries | source code hash | 80-1000x |
| Java classes | source code hash | 75-1000x |
| Docker layers | dependency hash | 3-10x |

## 🎯 Cache Behavior

### First Execution
```
1. Check cache → MISS
2. Install dependencies (slow)
3. Execute code
4. Save to cache
Total: ~15s
```

### Second Execution
```
1. Check cache → HIT
2. Restore from cache (fast)
3. Execute code
Total: ~3s ⚡
```

## 📊 Performance Metrics

### Hit Rate
- **>70%** — Excellent (cache working well)
- **50-70%** — Good (normal usage)
- **<50%** — Poor (increase cache size or check config)

### Cache Size
- Monitor with `/cache/stats`
- Automatic eviction when full
- LRU (Least Recently Used) policy

## 🔧 Troubleshooting

### Cache not improving performance
1. Check hit rate in `/cache/stats`
2. Verify cache directory exists and is writable
3. Check disk space
4. Review server logs for cache errors

### Cache fills up quickly
1. Increase `MAX_CACHE_SIZE`
2. Decrease `MAX_CACHE_AGE`
3. Clear cache manually
4. Check for duplicate dependencies

### Docker layer cache not working
1. Verify Docker daemon is running
2. Check Docker disk space
3. Review Docker image list: `docker images zenith-cache/*`
4. Clear Docker cache: `docker system prune`

## 💡 Best Practices

1. **Monitor regularly** — Check `/cache/stats` daily
2. **Set appropriate quotas** — Based on available disk space
3. **Pre-warm cache** — Run common projects once
4. **Clean periodically** — Remove old entries
5. **Use Docker images** — Pre-install common dependencies

## 📚 Cache Types

### Dependency Cache
- **Location:** `CACHE_DIR/npm`, `CACHE_DIR/pip`
- **Format:** Directories with hashed names
- **Persistence:** Until evicted or expired

### Docker Layer Cache
- **Location:** Docker daemon
- **Format:** Docker images with tag `zenith-cache/*`
- **Persistence:** Until removed or pruned

### Compiled Binary Cache
- **Location:** `CACHE_DIR/compiled`
- **Format:** Executable files with hashed names
- **Persistence:** Until evicted or expired

## 🎯 Quick Commands

```bash
# View cache stats
curl http://localhost:3001/cache/stats | jq

# Clear all caches
curl -X DELETE http://localhost:3001/cache/clear

# Check cache directory size
du -sh /tmp/ide-cache

# List cached Docker images
docker images zenith-cache/*

# Remove old Docker images
docker image prune -a --filter "until=168h"
```
