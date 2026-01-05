# Console Logging Configuration

This project is configured to automatically remove `console.log()` statements in production builds while keeping them during development.

## How It Works

### Frontend (Vite)
- **Development**: All console logs visible
- **Production Build**: `console.log()` statements automatically removed
- **Always Kept**: `console.error()` and `console.warn()`

Configuration in `vite.config.js`:
- Uses terser to drop console.log during minification
- esbuild also strips console in production mode

### Backend (NestJS)
- **Development**: All console logs visible
- **Production Build**: `console.log()` statements automatically removed  
- **Always Kept**: `console.error()` and `console.warn()`

Configuration in `webpack.config.js`:
- Uses terser-webpack-plugin to drop console.log during build
- Configured in `nest-cli.json` to use webpack

## Usage

### Development
```bash
# Frontend - all logs visible
npm run dev

# Backend - all logs visible
npm run start:dev
```

### Production Build
```bash
# Frontend - console.log removed
npm run build

# Backend - console.log removed
npm run build
npm run start:prod
```

## What Gets Removed
✅ `console.log()` - Debug statements  
✅ `debugger` - Debugger statements  

## What Stays
✅ `console.error()` - Error tracking  
✅ `console.warn()` - Warning messages  
✅ `console.info()` - Info messages (optional, currently kept)

## Benefits
- Clean production builds without manual code changes
- Debug logs available during development
- No risk of accidentally logging sensitive data in production
- Smaller bundle sizes
- Better performance

## Testing
To verify console removal in production:
```bash
# Build for production
npm run build

# Check the built files - console.log should be removed
# Frontend: dist/assets/*.js
# Backend: dist/**/*.js
```
