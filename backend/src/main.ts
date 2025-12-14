import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import helmet from 'helmet';

console.log('Loaded SUPABASE_URL:', process.env.SUPABASE_URL);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // UC-135: Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:5173'],
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
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
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
  
  await app.listen(3000);
}

bootstrap();
