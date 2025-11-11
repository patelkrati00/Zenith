# Python Runtime Image for Zenith IDE
# Optimized for security and minimal footprint

FROM python:3.11-alpine

# Install security updates and build dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    # Build dependencies for common packages
    gcc \
    musl-dev \
    linux-headers \
    libffi-dev \
    openssl-dev \
    # Utilities
    bash \
    curl && \
    rm -rf /var/cache/apk/*

# Upgrade pip and install common packages
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Create non-root user
RUN addgroup -g 1000 runner && \
    adduser -D -u 1000 -G runner runner

# Create workspace directory
RUN mkdir -p /workspace /executor && \
    chown -R runner:runner /workspace

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER runner

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python3 --version || exit 1

# Default command (will be overridden)
CMD ["python3", "--version"]
