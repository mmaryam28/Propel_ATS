import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, IsArray } from 'class-validator';

export class CreateExternalCertificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsIn(['HackerRank', 'LeetCode', 'Codecademy', 'Other'])
  platform: 'HackerRank' | 'LeetCode' | 'Codecademy' | 'Other';

  @IsOptional()
  @IsString()
  platformUsername?: string;

  @IsString()
  profileUrl: string;

  @IsOptional()
  @IsString()
  @IsIn(['verified', 'pending', 'manual', 'failed'])
  verificationStatus?: 'verified' | 'pending' | 'manual' | 'failed';

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @IsOptional()
  @IsNumber()
  overallRanking?: number;

  @IsOptional()
  @IsNumber()
  percentile?: number;

  @IsOptional()
  @IsNumber()
  totalProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  easyProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  mediumProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  hardProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  totalSubmissions?: number;

  @IsOptional()
  @IsNumber()
  acceptanceRate?: number;

  @IsOptional()
  @IsNumber()
  streakDays?: number;

  @IsOptional()
  @IsNumber()
  maxStreak?: number;

  @IsOptional()
  @IsNumber()
  totalBadges?: number;

  @IsOptional()
  @IsNumber()
  totalCoursesCompleted?: number;

  @IsOptional()
  scores?: any;

  @IsOptional()
  rankingData?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExternalCertificationDto {
  @IsOptional()
  @IsString()
  platformUsername?: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['verified', 'pending', 'manual', 'failed'])
  verificationStatus?: 'verified' | 'pending' | 'manual' | 'failed';

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @IsOptional()
  @IsNumber()
  overallRanking?: number;

  @IsOptional()
  @IsNumber()
  percentile?: number;

  @IsOptional()
  @IsNumber()
  totalProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  easyProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  mediumProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  hardProblemsSolved?: number;

  @IsOptional()
  @IsNumber()
  totalSubmissions?: number;

  @IsOptional()
  @IsNumber()
  acceptanceRate?: number;

  @IsOptional()
  @IsNumber()
  streakDays?: number;

  @IsOptional()
  @IsNumber()
  maxStreak?: number;

  @IsOptional()
  @IsNumber()
  totalBadges?: number;

  @IsOptional()
  @IsNumber()
  totalCoursesCompleted?: number;

  @IsOptional()
  scores?: any;

  @IsOptional()
  rankingData?: any;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBadgeDto {
  @IsString()
  externalCertificationId: string;

  @IsString()
  badgeName: string;

  @IsOptional()
  @IsString()
  badgeId?: string;

  @IsOptional()
  @IsString()
  badgeType?: string;

  @IsOptional()
  @IsString()
  badgeIconUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  earnedDate?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  skillLevel?: string;

  @IsOptional()
  @IsString()
  verificationUrl?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class CreateCourseDto {
  @IsString()
  externalCertificationId: string;

  @IsString()
  courseName: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  courseUrl?: string;

  @IsOptional()
  @IsString()
  completionDate?: string;

  @IsOptional()
  @IsNumber()
  completionPercentage?: number;

  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @IsOptional()
  @IsNumber()
  finalScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsLearned?: string[];
}

@Injectable()
export class ExternalCertificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  private getClient() {
    return this.supabase.getClient();
  }

  // Main Certifications CRUD
  async create(dto: CreateExternalCertificationDto) {
    const client = this.getClient();
    
    console.log('Creating external certification with userId:', dto.userId);
    
    const insertData = {
      user_id: dto.userId,
      platform: dto.platform,
      platform_username: dto.platformUsername || null,
      profile_url: dto.profileUrl,
      verification_status: dto.verificationStatus || 'pending',
      is_public: dto.isPublic !== undefined ? dto.isPublic : true,
      overall_score: dto.overallScore || null,
      overall_ranking: dto.overallRanking || null,
      percentile: dto.percentile || null,
      total_problems_solved: dto.totalProblemsSolved || 0,
      easy_problems_solved: dto.easyProblemsSolved || 0,
      medium_problems_solved: dto.mediumProblemsSolved || 0,
      hard_problems_solved: dto.hardProblemsSolved || 0,
      total_submissions: dto.totalSubmissions || 0,
      acceptance_rate: dto.acceptanceRate || null,
      streak_days: dto.streakDays || 0,
      max_streak: dto.maxStreak || 0,
      total_badges: dto.totalBadges || 0,
      total_courses_completed: dto.totalCoursesCompleted || 0,
      scores: dto.scores || {},
      ranking_data: dto.rankingData || {},
      notes: dto.notes || null,
    };
    
    console.log('Insert data:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await client
      .from('external_certifications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to create external certification: ${error.message}`);
    }

    return data;
  }

  async findAllByUser(userId: string) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certifications')
      .select(`
        *,
        badges:external_certification_badges(*),
        courses:external_certification_courses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch external certifications: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certifications')
      .select(`
        *,
        badges:external_certification_badges(*),
        courses:external_certification_courses(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException(`External certification not found: ${error.message}`);
    }

    return data;
  }

  async update(id: string, dto: UpdateExternalCertificationDto) {
    const client = this.getClient();
    
    const updateData: any = {};
    if (dto.platformUsername !== undefined) updateData.platform_username = dto.platformUsername;
    if (dto.profileUrl !== undefined) updateData.profile_url = dto.profileUrl;
    if (dto.verificationStatus !== undefined) updateData.verification_status = dto.verificationStatus;
    if (dto.isPublic !== undefined) updateData.is_public = dto.isPublic;
    if (dto.overallScore !== undefined) updateData.overall_score = dto.overallScore;
    if (dto.overallRanking !== undefined) updateData.overall_ranking = dto.overallRanking;
    if (dto.percentile !== undefined) updateData.percentile = dto.percentile;
    if (dto.totalProblemsSolved !== undefined) updateData.total_problems_solved = dto.totalProblemsSolved;
    if (dto.easyProblemsSolved !== undefined) updateData.easy_problems_solved = dto.easyProblemsSolved;
    if (dto.mediumProblemsSolved !== undefined) updateData.medium_problems_solved = dto.mediumProblemsSolved;
    if (dto.hardProblemsSolved !== undefined) updateData.hard_problems_solved = dto.hardProblemsSolved;
    if (dto.totalSubmissions !== undefined) updateData.total_submissions = dto.totalSubmissions;
    if (dto.acceptanceRate !== undefined) updateData.acceptance_rate = dto.acceptanceRate;
    if (dto.streakDays !== undefined) updateData.streak_days = dto.streakDays;
    if (dto.maxStreak !== undefined) updateData.max_streak = dto.maxStreak;
    if (dto.totalBadges !== undefined) updateData.total_badges = dto.totalBadges;
    if (dto.totalCoursesCompleted !== undefined) updateData.total_courses_completed = dto.totalCoursesCompleted;
    if (dto.scores !== undefined) updateData.scores = dto.scores;
    if (dto.rankingData !== undefined) updateData.ranking_data = dto.rankingData;
    if (dto.syncEnabled !== undefined) updateData.sync_enabled = dto.syncEnabled;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await client
      .from('external_certifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update external certification: ${error.message}`);
    }

    return data;
  }

  async delete(id: string) {
    const client = this.getClient();
    
    const { error } = await client
      .from('external_certifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete external certification: ${error.message}`);
    }

    return { message: 'External certification deleted successfully' };
  }

  async syncCertification(id: string) {
    const client = this.getClient();
    
    // Update last_synced_at timestamp
    const { data, error } = await client
      .from('external_certifications')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to sync certification: ${error.message}`);
    }

    return data;
  }

  // Badges CRUD
  async createBadge(dto: CreateBadgeDto) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certification_badges')
      .insert({
        external_certification_id: dto.externalCertificationId,
        badge_name: dto.badgeName,
        badge_id: dto.badgeId,
        badge_type: dto.badgeType,
        badge_icon_url: dto.badgeIconUrl,
        description: dto.description,
        earned_date: dto.earnedDate,
        expiration_date: dto.expirationDate,
        skill_level: dto.skillLevel,
        verification_url: dto.verificationUrl,
        is_verified: dto.isVerified || false,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create badge: ${error.message}`);
    }

    return data;
  }

  async findBadgesByCertification(certificationId: string) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certification_badges')
      .select('*')
      .eq('external_certification_id', certificationId)
      .order('earned_date', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch badges: ${error.message}`);
    }

    return data || [];
  }

  async updateBadge(id: string, updates: Partial<CreateBadgeDto>) {
    const client = this.getClient();
    
    const updateData: any = {};
    if (updates.badgeName !== undefined) updateData.badge_name = updates.badgeName;
    if (updates.badgeId !== undefined) updateData.badge_id = updates.badgeId;
    if (updates.badgeType !== undefined) updateData.badge_type = updates.badgeType;
    if (updates.badgeIconUrl !== undefined) updateData.badge_icon_url = updates.badgeIconUrl;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.earnedDate !== undefined) updateData.earned_date = updates.earnedDate;
    if (updates.expirationDate !== undefined) updateData.expiration_date = updates.expirationDate;
    if (updates.skillLevel !== undefined) updateData.skill_level = updates.skillLevel;
    if (updates.verificationUrl !== undefined) updateData.verification_url = updates.verificationUrl;
    if (updates.isVerified !== undefined) updateData.is_verified = updates.isVerified;

    const { data, error } = await client
      .from('external_certification_badges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update badge: ${error.message}`);
    }

    return data;
  }

  async deleteBadge(id: string) {
    const client = this.getClient();
    
    const { error } = await client
      .from('external_certification_badges')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete badge: ${error.message}`);
    }

    return { message: 'Badge deleted successfully' };
  }

  // Courses CRUD
  async createCourse(dto: CreateCourseDto) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certification_courses')
      .insert({
        external_certification_id: dto.externalCertificationId,
        course_name: dto.courseName,
        course_id: dto.courseId,
        course_url: dto.courseUrl,
        completion_date: dto.completionDate,
        completion_percentage: dto.completionPercentage,
        certificate_url: dto.certificateUrl,
        duration_hours: dto.durationHours,
        final_score: dto.finalScore,
        skills_learned: dto.skillsLearned,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create course: ${error.message}`);
    }

    return data;
  }

  async findCoursesByCertification(certificationId: string) {
    const client = this.getClient();
    
    const { data, error } = await client
      .from('external_certification_courses')
      .select('*')
      .eq('external_certification_id', certificationId)
      .order('completion_date', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch courses: ${error.message}`);
    }

    return data || [];
  }

  async updateCourse(id: string, updates: Partial<CreateCourseDto>) {
    const client = this.getClient();
    
    const updateData: any = {};
    if (updates.courseName !== undefined) updateData.course_name = updates.courseName;
    if (updates.courseId !== undefined) updateData.course_id = updates.courseId;
    if (updates.courseUrl !== undefined) updateData.course_url = updates.courseUrl;
    if (updates.completionDate !== undefined) updateData.completion_date = updates.completionDate;
    if (updates.completionPercentage !== undefined) updateData.completion_percentage = updates.completionPercentage;
    if (updates.certificateUrl !== undefined) updateData.certificate_url = updates.certificateUrl;
    if (updates.durationHours !== undefined) updateData.duration_hours = updates.durationHours;
    if (updates.finalScore !== undefined) updateData.final_score = updates.finalScore;
    if (updates.skillsLearned !== undefined) updateData.skills_learned = updates.skillsLearned;

    const { data, error } = await client
      .from('external_certification_courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update course: ${error.message}`);
    }

    return data;
  }

  async deleteCourse(id: string) {
    const client = this.getClient();
    
    const { error } = await client
      .from('external_certification_courses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete course: ${error.message}`);
    }

    return { message: 'Course deleted successfully' };
  }

  // Verification helper
  async verifyProfileUrl(platform: string, profileUrl: string): Promise<boolean> {
    // Simple URL validation based on platform
    const patterns = {
      HackerRank: /^https?:\/\/(www\.)?hackerrank\.com\/.+/i,
      LeetCode: /^https?:\/\/(www\.)?leetcode\.com\/.+/i,
      Codecademy: /^https?:\/\/(www\.)?codecademy\.com\/.+/i,
    };

    const pattern = patterns[platform];
    return pattern ? pattern.test(profileUrl) : true;
  }
}
