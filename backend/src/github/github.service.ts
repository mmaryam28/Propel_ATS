import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiMonitoringService } from '../api-monitoring/api-monitoring.service';
import axios from 'axios';

@Injectable()
export class GitHubService {
  private readonly clientId = process.env.GITHUB_CLIENT_ID;
  private readonly clientSecret = process.env.GITHUB_CLIENT_SECRET;
  private readonly redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/github/callback';

  constructor(
    private supabase: SupabaseService,
    private apiMonitoringService: ApiMonitoringService,
  ) {}

  // Generate GitHub OAuth URL
  getAuthUrl(userId: string) {
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    const scope = 'read:user,repo';
    const url = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&state=${state}`;
    
    return { url, state };
  }

  // Handle OAuth callback
  async handleCallback(code: string, state: string) {
    const start = Date.now();
    const serviceName = 'GitHub API';
    const quota = 5000; // GitHub authenticated API quota: 5000 requests/hour

    try {
      // Extract userId from state
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      const userId = decoded.userId;
      
      if (!userId) {
        throw new HttpException('Invalid state parameter', HttpStatus.BAD_REQUEST);
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        },
        {
          headers: { Accept: 'application/json' },
        },
      );

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const githubUser = userResponse.data;

      // Save connection
      const client = this.supabase.getClient();
      
      console.log('Attempting to save GitHub connection for userId:', userId);
      
      const { data, error } = await client
        .from('github_connections')
        .upsert(
          {
            user_id: userId,
            github_user_id: githubUser.id,
            github_username: githubUser.login,
            access_token: accessToken,
            avatar_url: githubUser.avatar_url,
            profile_url: githubUser.html_url,
            connected_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id', // Specify the unique constraint column
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to save GitHub connection:', error);
        throw error;
      }

      // Trigger initial sync
      await this.syncRepositories(userId);

      // Record successful API usage
      this.apiMonitoringService.recordUsage(serviceName, quota, Date.now() - start);

      return { success: true, connection: data };
    } catch (error) {
      // Record API error
      this.apiMonitoringService.recordError(serviceName, error?.message || String(error));
      console.error('GitHub OAuth error:', error);
      throw new HttpException(
        'Failed to connect GitHub account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get connection status
  async getConnection(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('github_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || null;
  }

  // Disconnect GitHub
  async disconnect(userId: string) {
    const client = this.supabase.getClient();
    
    // Delete repositories first
    await client.from('github_repositories').delete().eq('user_id', userId);
    
    // Delete connection
    const { error } = await client
      .from('github_connections')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  }

  // Sync repositories from GitHub
  async syncRepositories(userId: string) {
    const start = Date.now();
    const serviceName = 'GitHub API';
    const quota = 5000;

    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new HttpException('GitHub not connected', HttpStatus.BAD_REQUEST);
    }

    try {
      // Fetch repositories from GitHub
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${connection.access_token}` },
        params: {
          per_page: 100,
          sort: 'updated',
          affiliation: 'owner',
        },
      });

      const repos = response.data;
      const client = this.supabase.getClient();

      // Process each repository
      for (const repo of repos) {
        // Fetch languages for this repo
        let languages = {};
        try {
          const langResponse = await axios.get(repo.languages_url, {
            headers: { Authorization: `Bearer ${connection.access_token}` },
          });
          languages = langResponse.data;
        } catch (err) {
          console.error(`Failed to fetch languages for ${repo.name}:`, err);
        }

        // Fetch contribution stats (commits and activity)
        let contributionData: {
          total_commits: number;
          commit_frequency: Array<{ week: string; commits: number }>;
          last_commit_date: string | null;
          contributor_count: number;
        } = {
          total_commits: 0,
          commit_frequency: [],
          last_commit_date: null,
          contributor_count: 0,
        };

        try {
          // Fetch commit activity (past year of weekly stats)
          const activityResponse = await axios.get(
            `https://api.github.com/repos/${repo.full_name}/stats/commit_activity`,
            {
              headers: { Authorization: `Bearer ${connection.access_token}` },
            }
          );

          if (activityResponse.data && Array.isArray(activityResponse.data)) {
            // Calculate total commits from weekly data
            const weeklyData = activityResponse.data;
            contributionData.total_commits = weeklyData.reduce((sum, week) => sum + week.total, 0);
            
            // Store weekly commit frequency (last 12 weeks for efficiency)
            contributionData.commit_frequency = weeklyData.slice(-12).map(week => ({
              week: new Date(week.week * 1000).toISOString(),
              commits: week.total,
            }));
          }

          // Fetch contributor count
          const contributorsResponse = await axios.get(
            `https://api.github.com/repos/${repo.full_name}/contributors`,
            {
              headers: { Authorization: `Bearer ${connection.access_token}` },
              params: { per_page: 1, anon: 'true' },
            }
          );

          // Get contributor count from Link header if available
          const linkHeader = contributorsResponse.headers['link'];
          if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            contributionData.contributor_count = match ? parseInt(match[1]) : contributorsResponse.data.length;
          } else {
            contributionData.contributor_count = contributorsResponse.data.length;
          }

          // Get last commit date from repo's pushed_at
          contributionData.last_commit_date = repo.pushed_at;

        } catch (err) {
          console.error(`Failed to fetch contribution stats for ${repo.name}:`, err.message);
          // Continue without contribution data - it's not critical
        }

        // Upsert repository with contribution data
        await client.from('github_repositories').upsert({
          user_id: userId,
          github_repo_id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          languages: languages,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          open_issues: repo.open_issues_count,
          is_fork: repo.fork,
          is_private: repo.private,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          topics: repo.topics || [],
          synced_at: new Date().toISOString(),
          total_commits: contributionData.total_commits,
          commit_frequency: contributionData.commit_frequency,
          last_commit_date: contributionData.last_commit_date,
          contributor_count: contributionData.contributor_count,
          contributions_synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,github_repo_id',
        });
      }

      // Update last_synced_at
      await client
        .from('github_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', userId);

      // Record successful API usage
      this.apiMonitoringService.recordUsage(serviceName, quota, Date.now() - start);

      return { success: true, count: repos.length };
    } catch (error) {
      // Record error
      this.apiMonitoringService.recordError(serviceName, error?.message || String(error));
      console.error('Sync repositories error:', error);
      throw new HttpException(
        'Failed to sync repositories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get repositories
  async getRepositories(userId: string, featuredOnly = false, includePrivate = true) {
    const client = this.supabase.getClient();
    let query = client
      .from('github_repositories')
      .select('*')
      .eq('user_id', userId);

    // Filter out private repos if not requested
    if (!includePrivate) {
      query = query.eq('is_private', false);
    }

    if (featuredOnly) {
      query = query.eq('is_featured', true).order('featured_order', { ascending: true });
    } else {
      query = query.order('stars', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  // Get single repository
  async getRepository(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('github_repositories')
      .select('*, github_repo_skills(skill_id, skills(*))')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  }

  // Update repository
  async updateRepository(userId: string, id: string, updates: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('github_repositories')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  // Link repository to skill
  async linkSkill(userId: string, repoId: string, skillId: string) {
    // Verify repo belongs to user
    const repo = await this.getRepository(userId, repoId);
    if (!repo) {
      throw new HttpException('Repository not found', HttpStatus.NOT_FOUND);
    }

    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('github_repo_skills')
      .insert({ repo_id: repoId, skill_id: skillId })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  // Unlink repository from skill
  async unlinkSkill(userId: string, repoId: string, skillId: string) {
    // Verify repo belongs to user
    const repo = await this.getRepository(userId, repoId);
    if (!repo) {
      throw new HttpException('Repository not found', HttpStatus.NOT_FOUND);
    }

    const client = this.supabase.getClient();
    const { error } = await client
      .from('github_repo_skills')
      .delete()
      .eq('repo_id', repoId)
      .eq('skill_id', skillId);

    if (error) throw error;

    return { success: true };
  }

  // Get repository languages
  async getRepositoryLanguages(userId: string, id: string) {
    const repo = await this.getRepository(userId, id);
    return repo.languages || {};
  }
}
