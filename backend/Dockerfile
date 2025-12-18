# Backend Dockerfile for Railway deployment with Ollama support
# Multi-stage build for optimized image size and security

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy all source code
COPY . .

# Build the NestJS application (compiles TypeScript to JavaScript)
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Stage 2: Production runtime with Ollama
FROM node:20-alpine AS production

# Install curl for health checks and downloading Ollama
RUN apk add --no-cache curl bash dumb-init

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production node_modules from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# List files to debug (will show if start.sh exists in build context)
RUN ls -la /app || true

# Copy startup script from build context (Railway root is backend/)
COPY --chown=nestjs:nodejs ./start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose ports
# 3000 for NestJS API
# 11434 for Ollama (internal only)
EXPOSE 3000

# Use startup script to launch both Ollama and NestJS
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
