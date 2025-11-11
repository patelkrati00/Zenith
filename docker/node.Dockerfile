# Node.js Runtime Image for Zenith IDE
# Optimized for security and minimal footprint

FROM node:18-alpine

# Install required dependencies
RUN echo "https://mirrors.aliyun.com/alpine/v3.21/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.21/community/" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    bash \
    curl && \
    rm -rf /var/cache/apk/*

# Create workspace directory
RUN mkdir -p /workspace /executor && \
    chown -R node:node /workspace

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Default command
CMD ["node", "--version"]

