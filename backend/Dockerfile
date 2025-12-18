# Optimized Dockerfile with Ollama for Railway (under 4GB limit)
# Uses smaller model (tinyllama) to reduce image size

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Production runtime with Ollama
FROM node:20-alpine AS production

# Install minimal dependencies
RUN apk add --no-cache curl bash dumb-init ca-certificates

# Install Ollama (minimal installation, model pulled at runtime)
RUN curl -fsSL https://ollama.com/install.sh | sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app
COPY package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

# Use startup script to launch both Ollama and NestJS
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
