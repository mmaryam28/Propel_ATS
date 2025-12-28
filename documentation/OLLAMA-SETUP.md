# Ollama Setup Instructions

## Installation
1. Download Ollama from https://ollama.com/download/windows
2. Run the installer (or use `winget install Ollama.Ollama`)
3. Ollama will run as a background service on `http://localhost:11434`

## Pull a Model
After installation, run in terminal:
```bash
ollama pull llama3.2
```

Or use a smaller, faster model:
```bash
ollama pull phi3
```

## Test Ollama
```bash
ollama run llama3.2 "Hello, how are you?"
```

## Available Models
- `llama3.2` - 3B parameters, good balance of speed/quality
- `phi3` - 3.8B parameters, very fast
- `mistral` - 7B parameters, higher quality
- `llama3.1:8b` - 8B parameters, best quality but slower

## Backend Integration
The backend is configured to use Ollama at `http://localhost:11434`
No API key needed - it's completely free and runs locally!
