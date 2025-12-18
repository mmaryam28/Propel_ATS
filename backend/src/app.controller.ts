import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as Sentry from '@sentry/nestjs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck() {
    return { 
      status: 'API running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000
    };
  }

  @Get('/health')
  detailedHealthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected', // Add actual check if needed
        api: 'operational'
      }
    };
  }

  @Get('/debug-sentry')
  getError() {
    // Send a log before throwing the error
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint',
    });
    // Send a test metric before throwing the error
    Sentry.metrics.count('test_counter', 1);
    throw new Error('My first Sentry error!');
  }
}
