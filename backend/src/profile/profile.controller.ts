import { Controller, Get, Post, Put, Delete, Body, Req, UnauthorizedException, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileCompletenessService } from './profile-completeness.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private supabase: SupabaseService,
    private profileCompletenessService: ProfileCompletenessService
  ) {}

  @Get('overview')
  async getProfileOverview(@Req() req) {
    // Get userId from authenticated user (JWT token)
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    // Fetch user information - table name is lowercase 'users' in database
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, firstname, lastname, email, phone, location, title, bio, role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      throw new UnauthorizedException(`Failed to fetch user information: ${userError.message}`);
    }

    // Map database fields to expected frontend fields
    const userData = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone || '',
      location: user.location || '',
      headline: user.title || '', // 'title' column maps to 'headline'
      bio: user.bio || '',
      industry: '', // Not in schema, set empty
      experience_level: user.role || '' // 'role' column maps to 'experience_level'
    };

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
      user: userData,
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

  @Get('completeness')
  async getProfileCompleteness(@Req() req): Promise<any> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.profileCompletenessService.calculateCompleteness(userId);
  }

  /**
   * PUT /profile
   * Updates the user's profile information in the User table.
   * Requires: user to be authenticated (userId from req.user)
   */
  @Put()
  async updateProfile(@Req() req, @Body() body) {
    const userId = req.user?.userId || body.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    const { 
      firstname, 
      lastname, 
      email,
      bio, 
      phone, 
      role, 
      location, 
      title,
      headline,
      experience_level,
      linkedin_url, 
      github_url, 
      portfolio_url 
    } = body;
    
    const client = this.supabase.getClient();
    
    // Build update object with only provided fields
    const updateFields: any = {};
    if (firstname !== undefined) updateFields.firstname = firstname;
    if (lastname !== undefined) updateFields.lastname = lastname;
    if (email !== undefined) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;
    if (phone !== undefined) updateFields.phone = phone;
    if (role !== undefined) updateFields.role = role;
    if (experience_level !== undefined) updateFields.role = experience_level; // Map experience_level to role
    if (location !== undefined) updateFields.location = location;
    if (title !== undefined) updateFields.title = title;
    if (headline !== undefined) updateFields.title = headline; // Map headline to title
    if (linkedin_url !== undefined) updateFields.linkedin_url = linkedin_url;
    if (github_url !== undefined) updateFields.github_url = github_url;
    if (portfolio_url !== undefined) updateFields.portfolio_url = portfolio_url;

    if (Object.keys(updateFields).length === 0) {
      return { message: 'No profile fields provided' };
    }

    const { error } = await client.from('users').update(updateFields).eq('id', userId);
    if (error) {
      console.error('Profile update error:', error);
      throw new UnauthorizedException(`Failed to update profile: ${error.message}`);
    }
    return { message: 'Profile updated successfully' };
  }

  @Post('upload-picture')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Only image files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  async uploadProfilePicture(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Convert file buffer to base64
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const client = this.supabase.getClient();

    const { error } = await client
      .from('users')
      .update({ profile_picture: base64Image })
      .eq('id', userId);

    if (error) {
      return { message: 'Failed to update profile picture', error: error.message };
    }

    return { 
      message: 'Profile picture updated successfully',
      profile_picture: base64Image
    };
  }

  @Delete('remove-picture')
  async removeProfilePicture(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = this.supabase.getClient();

    const { error } = await client
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (error) {
      return { message: 'Failed to remove profile picture', error: error.message };
    }

    return { message: 'Profile picture removed successfully' };
  }
}
