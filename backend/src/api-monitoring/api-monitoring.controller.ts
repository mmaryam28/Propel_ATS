import { Controller, Get, Post } from '@nestjs/common';
import { ApiMonitoringService } from './api-monitoring.service';

@Controller('api-monitoring')
export class ApiMonitoringController {
  constructor(private readonly apiMonitoringService: ApiMonitoringService) {}

  @Get('usage')
  getUsageStats() {
    return this.apiMonitoringService.getUsageStats();
  }

  @Get('errors')
  getErrorLogs() {
    return this.apiMonitoringService.getErrorLogs();
  }

  @Get('alerts')
  getAlerts() {
    return this.apiMonitoringService.getAlerts();
  }

  @Get('response-times')
  getAverageResponseTimes() {
    return this.apiMonitoringService.getAverageResponseTimes();
  }

  @Post('seed-test-data')
  seedTestData() {
    // GitHub API - Moderate usage (quota: 5000/hour for authenticated requests)
    // Simulating repo syncing, contributor fetching, etc.
    for (let i = 0; i < 450; i++) {
      this.apiMonitoringService.recordUsage('GitHub API', 5000, 200 + Math.random() * 400);
    }

    // LinkedIn API - Normal usage (quota: 500/day typical for OAuth apps)
    // Simulating profile fetches and token exchanges
    for (let i = 0; i < 45; i++) {
      this.apiMonitoringService.recordUsage('LinkedIn API', 500, 300 + Math.random() * 500);
    }

    // NewsAPI - High usage, approaching limit (quota: 100/day free tier)
    // Simulating company news lookups
    for (let i = 0; i < 92; i++) {
      this.apiMonitoringService.recordUsage('NewsAPI', 100, 400 + Math.random() * 600);
    }

    // Gmail API - Active usage (quota: ~10,000 per 10 minutes)
    // Simulating email fetching and searching
    for (let i = 0; i < 850; i++) {
      this.apiMonitoringService.recordUsage('Gmail API', 10000, 150 + Math.random() * 300);
    }

    // Outlook API - Active usage (quota: 10,000 per 10 minutes)
    // Simulating email operations
    for (let i = 0; i < 1200; i++) {
      this.apiMonitoringService.recordUsage('Outlook API', 10000, 180 + Math.random() * 350);
    }

    // Record realistic errors
    this.apiMonitoringService.recordError('GitHub API', 'API rate limit exceeded for secondary rate limit');
    this.apiMonitoringService.recordError('NewsAPI', 'You have made too many requests recently. Developer accounts are limited to 100 requests per day');
    this.apiMonitoringService.recordError('LinkedIn API', 'Invalid authentication credentials');
    this.apiMonitoringService.recordError('Gmail API', 'Quota exceeded for quota metric \'Queries\' and limit \'Queries per minute\'');
    this.apiMonitoringService.recordError('Outlook API', 'The token is expired');

    return { 
      message: 'Realistic test data seeded successfully!',
      timestamp: new Date().toISOString(),
      summary: {
        'GitHub API': '450/5000 per hour',
        'LinkedIn API': '45/500 per day',
        'NewsAPI': '92/100 per day (Alert!)',
        'Gmail API': '850/10000 per 10 min',
        'Outlook API': '1200/10000 per 10 min',
      }
    };
  }
}
