#!/bin/bash
set -e

echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

echo "⏳ Waiting for Ollama..."
for i in {1..30}; do
  if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Ollama ready!"
    break
  fi
  sleep 1
done

MODEL=${OLLAMA_MODEL:-phi3}
echo "📥 Pulling model: $MODEL"
ollama pull $MODEL || echo "⚠️ Model pull failed, continuing..."

echo "🎯 Starting NestJS..."
exec node dist/main
