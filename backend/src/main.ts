// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
import './instrument';

// All other imports below
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

console.log('Loaded SUPABASE_URL:', process.env.SUPABASE_URL);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable body parsing
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  
  // Log all requests
  app.use((req, res, next) => {
    if (req.path === '/responses' && req.method === 'POST') {
      console.log('=== RAW REQUEST DEBUG ===');
      console.log('Method:', req.method);
      console.log('Path:', req.path);
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('========================');
    }
    next();
  });
  
  // UC-135: Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:5173', 'https://cs-490-project.vercel.app', 'https://cs-490-project-l12tt6cfg-khalid-itanis-projects.vercel.app'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));
  
  // CORS Configuration - Allow both local and production frontends
  const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:3000', // Local backend
    'https://cs-490-project.vercel.app', // Production frontend
    'https://cs-490-project-l12tt6cfg-khalid-itanis-projects.vercel.app', // Vercel preview
    process.env.FRONTEND_URL, // Additional production frontend from env
  ].filter(Boolean); // Remove undefined/null values

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false, // set to true if using HTTPS in production
        httpOnly: true, // Prevent XSS access to session cookie
        sameSite: 'strict', // CSRF protection
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    }),
  );
  
  // UC-135: CSRF Protection disabled globally to avoid breaking existing auth
  // CSRF protection is demonstrated via /security/test-csrf endpoint
  // In production, apply CSRF selectively to state-changing operations
  
  // Railway deployment: Use PORT environment variable or default to 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on port ${port}`);
}

bootstrap();
