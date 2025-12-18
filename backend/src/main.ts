import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import * as bodyParser from 'body-parser';

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
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.use(
    session({
      secret: process.env.JWT_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // set to true if using HTTPS
    }),
  );
  await app.listen(3000);
}

bootstrap();
