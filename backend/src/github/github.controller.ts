import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  Redirect,
} from '@nestjs/common';
import { GitHubService } from './github.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('github')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  // Get GitHub OAuth URL
  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req) {
    const userId = req.user.userId;
    return this.githubService.getAuthUrl(userId);
  }

  // Handle OAuth callback (no auth guard - GitHub redirects here)
  @Get('callback')
  @Redirect()
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    try {
      const result = await this.githubService.handleCallback(code, state);
      // Determine frontend URL (allow multiple env var fallbacks)
      const rawFrontend = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || process.env.FRONTEND_HOST || 'http://localhost:5173';
      const frontendUrl = String(rawFrontend).replace(/\/$/, ''); // Remove trailing slash
      const redirectUrl = `${frontendUrl}/projects?tab=github`;

      // Log helpful diagnostic info for deployed environments
      console.info('[GitHubCallback] Using FRONTEND_URL:', rawFrontend);
      console.info('[GitHubCallback] Using GITHUB_REDIRECT_URI:', process.env.GITHUB_REDIRECT_URI || 'not-set');
      console.info('[GitHubCallback] Redirecting to:', redirectUrl);
      if (process.env.NODE_ENV === 'production' && /localhost[:]?/i.test(frontendUrl)) {
        console.warn('[GitHubCallback] WARNING: FRONTEND_URL resolves to localhost in production. Set FRONTEND_URL in your environment to the deployed frontend domain.');
      }

      // Redirect to frontend projects page
      return { url: redirectUrl, statusCode: 302 };
    } catch (error) {
      console.error('GitHub callback error:', error);
      const rawFrontend = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || process.env.FRONTEND_HOST || 'http://localhost:5173';
      const frontendUrl = String(rawFrontend).replace(/\/$/, ''); // Remove trailing slash
      const errorRedirect = `${frontendUrl}/projects?error=github_connection_failed`;
      console.info('[GitHubCallback] Redirecting on error to:', errorRedirect);
      return { url: errorRedirect, statusCode: 302 };
    }
  }

  // Get connection status
  @Get('connection')
  @UseGuards(JwtAuthGuard)
  async getConnection(@Req() req) {
    const userId = req.user.userId;
    return this.githubService.getConnection(userId);
  }

  // Disconnect GitHub
  @Delete('connection')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req) {
    const userId = req.user.userId;
    return this.githubService.disconnect(userId);
  }

  // Sync repositories
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncRepositories(@Req() req) {
    const userId = req.user.userId;
    return this.githubService.syncRepositories(userId);
  }

  // Get all repositories
  @Get('repositories')
  @UseGuards(JwtAuthGuard)
  async getRepositories(
    @Req() req, 
    @Query('featured') featured?: string,
    @Query('includePrivate') includePrivate?: string
  ) {
    const userId = req.user.userId;
    const isFeatured = featured === 'true';
    const shouldIncludePrivate = includePrivate !== 'false'; // Default to true
    return this.githubService.getRepositories(userId, isFeatured, shouldIncludePrivate);
  }

  // Get single repository
  @Get('repositories/:id')
  @UseGuards(JwtAuthGuard)
  async getRepository(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.githubService.getRepository(userId, id);
  }

  // Update repository (feature/unfeature)
  @Patch('repositories/:id')
  @UseGuards(JwtAuthGuard)
  async updateRepository(
    @Req() req,
    @Param('id') id: string,
    @Body() data: { is_featured?: boolean; featured_order?: number },
  ) {
    const userId = req.user.userId;
    return this.githubService.updateRepository(userId, id, data);
  }

  // Link repository to skill
  @Post('repositories/:id/skills')
  @UseGuards(JwtAuthGuard)
  async linkSkill(@Req() req, @Param('id') repoId: string, @Body('skill_id') skillId: string) {
    const userId = req.user.userId;
    return this.githubService.linkSkill(userId, repoId, skillId);
  }

  // Unlink repository from skill
  @Delete('repositories/:id/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  async unlinkSkill(@Req() req, @Param('id') repoId: string, @Param('skillId') skillId: string) {
    const userId = req.user.userId;
    return this.githubService.unlinkSkill(userId, repoId, skillId);
  }

  // Get repository languages
  @Get('repositories/:id/languages')
  @UseGuards(JwtAuthGuard)
  async getRepositoryLanguages(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.githubService.getRepositoryLanguages(userId, id);
  }
}
