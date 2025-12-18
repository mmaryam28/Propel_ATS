# Multi-stage Dockerfile for NestJS + Ollama on Railway
# Model is pulled at RUNTIME, not baked into image

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm install --only=development && npm run build

FROM node:20-alpine
RUN apk add --no-cache curl bash dumb-init && \
    curl -fsSL https://ollama.com/install.sh | sh && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    rm -rf /var/cache/apk/*

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
