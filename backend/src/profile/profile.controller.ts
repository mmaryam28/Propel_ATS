import { Controller, Get, Put, Body, Req, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('profile')
export class ProfileController {
  constructor(private supabase: SupabaseService) {}

  @Get('overview')
  async getProfileOverview(@Req() req) {
    const userId = req.query.userId ? String(req.query.userId) : null;
    if (!userId) {
      return { message: 'provide userId as query param for overview' };
    }

    const client = this.supabase.getClient();

    // Fetch recent education, certifications, projects
    const [education, certifications, projects] = await Promise.all([
      client.from('education').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(5),
      client.from('certifications').select('*').eq('user_id', userId).order('date_earned', { ascending: false }).limit(5),
      client.from('projects').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(6),
    ]);

    // Fetch counts
    const [educationCount, certificationCount, projectCount] = await Promise.all([
      client.from('education').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('certifications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    // Calculate completion
    const completion = await this.calculateProfileCompletion(userId);

    return {
      summary: {
        educationCount: educationCount.count ?? 0,
        certificationCount: certificationCount.count ?? 0,
        projectCount: projectCount.count ?? 0,
      },
      recent: {
        education: education.data ?? [],
        certifications: certifications.data ?? [],
        projects: projects.data ?? [],
      },
      completion,
    };
  }

  // very small heuristic for profile completion
  private async calculateProfileCompletion(userId: string) {
    const client = this.supabase.getClient();
    const totalSections = 4; // employment, skills, education, projects (approx)
    const checks: number[] = [];
    const educCount = (await client.from('education').select('id', { count: 'exact', head: true }).eq('user_id', userId)).count ?? 0;
    checks.push(educCount > 0 ? 1 : 0);
    const certCount = (await client.from('certifications').select('id', { count: 'exact', head: true }).eq('user_id', userId)).count ?? 0;
    checks.push(certCount > 0 ? 1 : 0);
    const projectCount = (await client.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId)).count ?? 0;
    checks.push(projectCount > 0 ? 1 : 0);
    // rudimentary skill/employment detection: look for job applications as proxy
    const apps = (await client.from('job_applications').select('id', { count: 'exact', head: true }).eq('user_id', userId)).count ?? 0;
    checks.push(apps > 0 ? 1 : 0);

    const score = Math.round((checks.reduce((a, b) => a + b, 0) / totalSections) * 100);
    return { score, sections: { education: educCount, certifications: certCount, projects: projectCount, applications: apps } };
  }

  /**
   * PUT /profile
   * Updates the user's profile (name, bio, phone) in the User table.
   * Expects: { name, bio, phone }
   * Requires: user to be authenticated (userId from req.user or req.body)
   */
  @Put()
  async updateProfile(@Req() req, @Body() body) {
    // You may need to extract userId from req.user if using JWT auth, or from body for testing
    const userId = req.user?.id || body.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const { name, bio, phone } = body;
    if (!name && !bio && !phone) {
      return { message: 'No profile fields provided' };
    }
    const client = this.supabase.getClient();
    // Update the User table with provided fields
    const updateFields = {};
    if (name !== undefined) updateFields['firstname'] = name;
    if (bio !== undefined) updateFields['bio'] = bio;
    if (phone !== undefined) updateFields['phone'] = phone;

    // Check if columns exist in User table (bio, phone). If not, you may need to add them in Prisma schema and migrate.
    const { error } = await client.from('User').update(updateFields).eq('id', userId);
    if (error) {
      return { message: 'Failed to update profile', error: error.message };
    }
    return { message: 'Profile updated successfully' };
  }
}
