import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ExternalCertificationsService,
  CreateExternalCertificationDto,
  UpdateExternalCertificationDto,
  CreateBadgeDto,
  CreateCourseDto,
} from './external-certifications.service';

@Controller('external-certifications')
@UseGuards(JwtAuthGuard)
export class ExternalCertificationsController {
  constructor(private readonly service: ExternalCertificationsService) {}

  // Main Certifications Endpoints
  @Post()
  async create(@Req() req, @Body() dto: CreateExternalCertificationDto) {
    console.log('Received DTO:', dto);
    
    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Verify profile URL format
    const isValid = await this.service.verifyProfileUrl(dto.platform, dto.profileUrl);
    if (!isValid) {
      throw new BadRequestException(`Invalid ${dto.platform} profile URL format`);
    }

    // Override userId from JWT token (ignore any userId sent in body)
    const createDto = {
      platform: dto.platform,
      platformUsername: dto.platformUsername,
      profileUrl: dto.profileUrl,
      verificationStatus: dto.verificationStatus,
      isPublic: dto.isPublic,
      overallScore: dto.overallScore,
      overallRanking: dto.overallRanking,
      percentile: dto.percentile,
      totalProblemsSolved: dto.totalProblemsSolved,
      easyProblemsSolved: dto.easyProblemsSolved,
      mediumProblemsSolved: dto.mediumProblemsSolved,
      hardProblemsSolved: dto.hardProblemsSolved,
      totalSubmissions: dto.totalSubmissions,
      acceptanceRate: dto.acceptanceRate,
      streakDays: dto.streakDays,
      maxStreak: dto.maxStreak,
      totalBadges: dto.totalBadges,
      totalCoursesCompleted: dto.totalCoursesCompleted,
      scores: dto.scores,
      rankingData: dto.rankingData,
      notes: dto.notes,
      userId: userId,
    };

    console.log('Final DTO being sent to service:', createDto);

    return this.service.create(createDto);
  }

  @Get('user/:userId')
  async findAllByUser(@Param('userId') userId: string) {
    return this.service.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateExternalCertificationDto) {
    // If profile URL is being updated, verify it
    if (dto.profileUrl) {
      const cert = await this.service.findOne(id);
      const isValid = await this.service.verifyProfileUrl(cert.platform, dto.profileUrl);
      if (!isValid) {
        throw new BadRequestException(`Invalid ${cert.platform} profile URL format`);
      }
    }

    return this.service.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.service.syncCertification(id);
  }

  // Badge Endpoints
  @Post('badges')
  async createBadge(@Body() dto: CreateBadgeDto) {
    return this.service.createBadge(dto);
  }

  @Get(':certificationId/badges')
  async findBadges(@Param('certificationId') certificationId: string) {
    return this.service.findBadgesByCertification(certificationId);
  }

  @Put('badges/:id')
  async updateBadge(@Param('id') id: string, @Body() updates: Partial<CreateBadgeDto>) {
    return this.service.updateBadge(id, updates);
  }

  @Delete('badges/:id')
  async deleteBadge(@Param('id') id: string) {
    return this.service.deleteBadge(id);
  }

  // Course Endpoints
  @Post('courses')
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.service.createCourse(dto);
  }

  @Get(':certificationId/courses')
  async findCourses(@Param('certificationId') certificationId: string) {
    return this.service.findCoursesByCertification(certificationId);
  }

  @Put('courses/:id')
  async updateCourse(@Param('id') id: string, @Body() updates: Partial<CreateCourseDto>) {
    return this.service.updateCourse(id, updates);
  }

  @Delete('courses/:id')
  async deleteCourse(@Param('id') id: string) {
    return this.service.deleteCourse(id);
  }
}
