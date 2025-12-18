#!/bin/bash
# Startup script for Railway deployment
# Starts Ollama service and pulls phi3 model, then starts NestJS backend

echo "🚀 Starting Ollama service..."

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!

echo "⏳ Waiting for Ollama to be ready..."
# Wait for Ollama to be ready (max 30 seconds)
for i in {1..30}; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# Pull the phi3 model if OLLAMA_MODEL is set, otherwise use phi3
MODEL=${OLLAMA_MODEL:-phi3}
echo "📥 Pulling Ollama model: $MODEL"
ollama pull $MODEL

if [ $? -eq 0 ]; then
  echo "✅ Model $MODEL pulled successfully!"
else
  echo "⚠️  Warning: Failed to pull model $MODEL, but continuing..."
fi

# List available models for verification
echo "📋 Available models:"
ollama list

echo "🎯 Starting NestJS application..."
# Start the NestJS backend (this will run in foreground)
# Using su to switch to nestjs user for security
su nestjs -c "node dist/main"

# If NestJS exits, also kill Ollama
kill $OLLAMA_PID 2>/dev/null
