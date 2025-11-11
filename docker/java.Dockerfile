# Java Runtime Image for Zenith IDE
# Based on lightweight Alpine JDK image

FROM eclipse-temurin:17-jdk-alpine

# ✅ Use a reliable mirror (Aliyun) and install utilities
RUN echo "https://mirrors.aliyun.com/alpine/v3.22/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.22/community/" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
    bash \
    curl && \
    rm -rf /var/cache/apk/*

# Create workspace
RUN mkdir -p /workspace /executor && \
    chown -R root:root /workspace

# Set working directory
WORKDIR /workspace

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD java --version || exit 1

# Default command
CMD ["java", "--version"]
