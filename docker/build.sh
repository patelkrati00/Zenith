#!/bin/bash
set -e

# Build script for Zenith IDE Docker images
# Builds all language runtime images with proper tags

echo "🐳 Building Zenith IDE Docker Images"
echo "======================================"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Image tag prefix
TAG_PREFIX="zenith-ide"

# Build Node.js image
echo -e "\n${BLUE}📦 Building Node.js image...${NC}"
docker build -f node.Dockerfile -t ${TAG_PREFIX}/node:latest -t ${TAG_PREFIX}/node:18 .
echo -e "${GREEN}✅ Node.js image built${NC}"

# Build Python image
echo -e "\n${BLUE}🐍 Building Python image...${NC}"
docker build -f python.Dockerfile -t ${TAG_PREFIX}/python:latest -t ${TAG_PREFIX}/python:3.11 .
echo -e "${GREEN}✅ Python image built${NC}"

# Build C/C++ image
echo -e "\n${BLUE}⚙️  Building C/C++ image...${NC}"
docker build -f cpp.Dockerfile -t ${TAG_PREFIX}/cpp:latest -t ${TAG_PREFIX}/cpp:13 .
echo -e "${GREEN}✅ C/C++ image built${NC}"

# Build Java image
echo -e "\n${BLUE}☕ Building Java image...${NC}"
docker build -f java.Dockerfile -t ${TAG_PREFIX}/java:latest -t ${TAG_PREFIX}/java:17 .
echo -e "${GREEN}✅ Java image built${NC}"

# List built images
echo -e "\n${BLUE}📋 Built images:${NC}"
docker images | grep ${TAG_PREFIX}

echo -e "\n${GREEN}✨ All images built successfully!${NC}"
echo ""
echo "To use these images, update backend/server.js and backend/ws-runner.js:"
echo "  node: '${TAG_PREFIX}/node:latest'"
echo "  python: '${TAG_PREFIX}/python:latest'"
echo "  cpp: '${TAG_PREFIX}/cpp:latest'"
echo "  java: '${TAG_PREFIX}/java:latest'"
