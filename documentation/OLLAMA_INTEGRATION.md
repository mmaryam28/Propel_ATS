# Ollama Integration Guide

## Overview
Your application uses Ollama with the phi3 model for AI-powered cover letter generation. This guide explains how Ollama is integrated and deployment options.

## Local Development

### Prerequisites
1. Install Ollama: https://ollama.com/download
2. Pull the phi3 model:
   ```bash
   ollama pull phi3
   ```

### Configuration
Your `.env` file should have:
```env
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=phi3
```

### Testing Locally
```bash
# Start Ollama (if not already running)
ollama serve

# In another terminal, start your backend
cd backend
npm run start:dev
```

## Railway Deployment Options

### Option 1: Deploy with Ollama (Higher Cost)

**Pros:**
- Full offline AI capabilities
- No external API costs
- Complete control

**Cons:**
- Requires significant RAM (2-4GB minimum)
- Railway Pro plan recommended ($20/month)
- Slower cold starts (model must load)
- Higher resource usage

**Setup:**
1. Use the default `Dockerfile` (already includes Ollama)
2. Set environment variables in Railway:
   ```env
   OLLAMA_URL=http://localhost:11434/api/generate
   OLLAMA_MODEL=phi3
   ```
3. Deploy to Railway Pro plan
4. First startup will take 2-3 minutes (downloading phi3 model)

### Option 2: Deploy without Ollama (Lower Cost)

**Pros:**
- Much cheaper (can use Hobby plan)
- Faster startup
- Lower resource usage
- Better for production

**Cons:**
- Requires OpenAI API key (pay per use)
- External API dependency

**Setup:**
1. Rename `Dockerfile.no-ollama` to `Dockerfile`:
   ```bash
   cd backend
   mv Dockerfile Dockerfile.with-ollama
   mv Dockerfile.no-ollama Dockerfile
   ```

2. Update your cover letter service to use OpenAI fallback
3. Set OpenAI API key in Railway:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

## Understanding the Startup Script

The `start.sh` script handles Ollama initialization:

```bash
#!/bin/bash
# 1. Start Ollama in background
ollama serve &

# 2. Wait for Ollama to be ready (max 30 seconds)
for i in {1..30}; do
  curl -s http://localhost:11434/api/tags && break
  sleep 1
done

# 3. Pull the phi3 model
ollama pull phi3

# 4. Start NestJS application
node dist/main
```

### What Happens on Railway:
1. Container starts
2. Ollama service launches
3. phi3 model downloads (~1.6GB)
4. NestJS backend starts
5. Ready to handle requests

**First deployment:** Takes 2-3 minutes
**Subsequent deploys:** Model is cached, starts faster

## Monitoring Ollama

### Check if Ollama is Running
```bash
curl http://localhost:11434/api/tags
```

### List Available Models
```bash
ollama list
```

### Test Model Directly
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "phi3",
  "prompt": "Write a cover letter intro",
  "stream": false
}'
```

## Resource Requirements

### Minimum Specs (phi3):
- **RAM:** 2GB
- **CPU:** 2 cores
- **Disk:** 5GB (for model storage)
- **Startup time:** 2-3 minutes

### Recommended Specs:
- **RAM:** 4GB+
- **CPU:** 4 cores
- **Disk:** 10GB
- **Startup time:** 1-2 minutes

## Alternative Models

You can switch to different models by changing `OLLAMA_MODEL`:

| Model | Size | RAM Required | Speed | Quality |
|-------|------|--------------|-------|---------|
| phi3 | 1.6GB | 2GB | Fast | Good |
| llama2 | 3.8GB | 4GB | Medium | Better |
| mistral | 4.1GB | 4GB | Medium | Better |
| llama2:13b | 7.3GB | 8GB | Slow | Best |

**Example:**
```env
OLLAMA_MODEL=mistral
```

## Troubleshooting

### "Ollama not responding"
- Check if Ollama service started: `ps aux | grep ollama`
- Check startup logs in Railway dashboard
- Increase startup timeout in `start.sh`

### "Model download failed"
- Check disk space
- Verify internet connectivity
- Try smaller model (phi3:mini)

### "Out of memory"
- Upgrade Railway plan
- Switch to smaller model
- Use OpenAI API instead

### "Slow response times"
- Normal for first request (model loads into RAM)
- Subsequent requests should be faster
- Consider using streaming for better UX

## Cost Comparison

### Ollama on Railway Pro:
- Fixed cost: $20/month
- Unlimited generations
- Best for: High volume usage

### OpenAI API:
- Pay per token
- ~$0.002 per cover letter
- Best for: Low-medium volume

**Break-even point:** ~10,000 cover letters/month

## Hybrid Approach

You can support both Ollama and OpenAI:

```typescript
// In coverletters.ai.service.ts
async generateCoverLetter(data) {
  if (process.env.OLLAMA_URL) {
    return this.generateWithOllama(data);
  } else if (process.env.OPENAI_API_KEY) {
    return this.generateWithOpenAI(data);
  }
  throw new Error('No AI service configured');
}
```

## Production Recommendations

1. **Start with Ollama** (if budget allows)
   - Full control
   - Better for testing
   - No API rate limits

2. **Switch to OpenAI** for scale
   - More reliable
   - Better quality
   - Easier to manage

3. **Use both**
   - Ollama for development
   - OpenAI for production
   - Easy environment switching

## Security Notes

- Ollama runs on localhost only (port 11434)
- Not exposed to internet
- Railway handles HTTPS termination
- No additional security config needed

## Next Steps

1. Test locally with Ollama
2. Deploy to Railway (choose option)
3. Monitor resource usage
4. Optimize model choice
5. Consider hybrid approach
