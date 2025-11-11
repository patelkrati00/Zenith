# C/C++ Runtime Image for Zenith IDE
# Includes GCC/G++ compiler toolchain

FROM gcc:13-bookworm

# Install security updates and utilities
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    # Build tools
    make \
    cmake \
    # Utilities
    bash \
    curl \
    # Cleanup
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 runner && \
    useradd -m -u 1000 -g runner runner

# Create workspace directory
RUN mkdir -p /workspace /executor && \
    chown -R runner:runner /workspace

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER runner

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD gcc --version || exit 1

# Default command (will be overridden)
CMD ["gcc", "--version"]
