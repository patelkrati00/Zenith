# Backend API Server Dockerfile
# Multi-stage build for minimal production image

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Production
FROM node:18-alpine

# Install Docker CLI (for spawning containers)
RUN apk add --no-cache docker-cli curl

# Create app user
RUN addgroup -g 1001 appuser && \
    adduser -D -u 1001 -G appuser appuser

# Create app directory
WORKDIR /app

# Copy dependencies and package.json from builder
COPY --from=builder /build/node_modules ./node_modules
COPY backend/package*.json ./

# Copy application code
COPY backend/*.js ./
COPY backend/.env.example ./.env.example
COPY executor /app/executor

# Change ownership
RUN chown -R appuser:appuser /app && \
    chmod +x /app/executor/*.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start server
CMD ["node", "server.js"]
