import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SalaryService } from './salary.service';

/**
 * UC-112: Salary Cache Scheduler
 * Handles periodic refresh of expired salary cache entries
 * Uses simple interval-based scheduling without external dependencies
 */
@Injectable()
export class SalaryCacheScheduler implements OnModuleInit {
  private readonly logger = new Logger(SalaryCacheScheduler.name);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private isRefreshing = false;

  constructor(private salaryService: SalaryService) {}

  /**
   * Initialize scheduler when module loads
   */
  onModuleInit() {
    this.startScheduler();
  }

  /**
   * Start the scheduled task
   */
  private startScheduler() {
    this.logger.log('Starting salary cache scheduler...');

    // Run cache refresh immediately on startup (but don't block)
    this.runRefreshAsync();

    // Schedule periodic refresh (every 7 days)
    this.refreshInterval = setInterval(() => {
      this.runRefreshAsync();
    }, this.REFRESH_INTERVAL_MS);

    this.logger.log(
      `Salary cache refresh scheduled every ${this.REFRESH_INTERVAL_MS / (24 * 60 * 60 * 1000)} days`,
    );
  }

  /**
   * Run refresh asynchronously without blocking
   */
  private async runRefreshAsync() {
    if (this.isRefreshing) {
      this.logger.warn('Refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;

    try {
      this.logger.log('Starting periodic salary cache refresh...');
      const result = await this.salaryService.refreshExpiredCache();
      this.logger.log(
        `Salary cache refresh completed: ${result.refreshed} refreshed, ${result.failed} failed`,
      );
    } catch (error) {
      this.logger.error(`Salary cache refresh failed: ${error.message}`);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually trigger a refresh
   */
  async triggerRefresh() {
    return this.runRefreshAsync();
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.logger.log('Salary cache scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isActive: this.refreshInterval !== null,
      isRefreshing: this.isRefreshing,
      refreshIntervalDays: this.REFRESH_INTERVAL_MS / (24 * 60 * 60 * 1000),
    };
  }
}
