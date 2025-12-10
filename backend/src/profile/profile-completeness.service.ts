import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface SectionScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  requiredFields: { field: string; present: boolean; required: boolean }[];
}

interface ProfileCompleteness {
  overallScore: number;
  overallPercentage: number;
  sections: {
    basicInfo: SectionScore;
    employment: SectionScore;
    education: SectionScore;
    skills: SectionScore;
    projects: SectionScore;
    certifications: SectionScore;
  };
  badges: string[];
  recommendations: string[];
  industryBenchmark: {
    userScore: number;
    industryAverage: number;
    percentile: number;
  };
}

@Injectable()
export class ProfileCompletenessService {
  constructor(private supabase: SupabaseService) {}

  private readonly INDUSTRY_BENCHMARKS = {
    'technology': 78,
    'healthcare': 72,
    'finance': 75,
    'education': 70,
    'manufacturing': 68,
    'retail': 65,
    'default': 70
  };

  private readonly BADGE_THRESHOLDS = [
    { threshold: 25, name: 'Getting Started', icon: '🌱' },
    { threshold: 50, name: 'Profile Builder', icon: '🏗️' },
    { threshold: 75, name: 'Profile Expert', icon: '⭐' },
    { threshold: 90, name: 'All-Star Profile', icon: '🌟' },
    { threshold: 100, name: 'Perfect Profile', icon: '🏆' }
  ];

  async calculateCompleteness(userId: string): Promise<ProfileCompleteness> {
    const client = this.supabase.getClient();

    // Fetch all profile data in parallel
    const [user, employment, education, skills, projects, certifications] = await Promise.all([
      client.from('users').select('*').eq('id', userId).single(),
      client.from('employment').select('*').eq('user_id', userId),
      client.from('education').select('*').eq('user_id', userId),
      client.from('user_skills').select('*, skills(*)').eq('user_id', userId),
      client.from('projects').select('*').eq('user_id', userId),
      client.from('certifications').select('*').eq('user_id', userId)
    ]);

    const userData = user.data || {};
    const employmentData = employment.data || [];
    const educationData = education.data || [];
    const skillsData = skills.data || [];
    const projectsData = projects.data || [];
    const certificationsData = certifications.data || [];

    // Calculate section scores
    const sections = {
      basicInfo: this.calculateBasicInfoScore(userData),
      employment: this.calculateEmploymentScore(employmentData),
      education: this.calculateEducationScore(educationData),
      skills: this.calculateSkillsScore(skillsData),
      projects: this.calculateProjectsScore(projectsData),
      certifications: this.calculateCertificationsScore(certificationsData)
    };

    // Calculate overall score
    const totalScore = Object.values(sections).reduce((sum, section) => sum + section.score, 0);
    const totalMaxScore = Object.values(sections).reduce((sum, section) => sum + section.maxScore, 0);
    const overallPercentage = Math.round((totalScore / totalMaxScore) * 100);

    // Determine badges earned
    const badges = this.determineBadges(overallPercentage);

    // Generate recommendations
    const recommendations = this.generateRecommendations(sections, userData);

    // Calculate industry benchmark (industry field doesn't exist in DB, use default)
    const industryBenchmark = this.calculateIndustryBenchmark(
      overallPercentage,
      'default'
    );

    // Save to database
    await this.saveCompleteness(userId, {
      overall_score: overallPercentage,
      section_scores: sections,
      badges_earned: badges.map(b => b.name)
    });

    return {
      overallScore: totalScore,
      overallPercentage,
      sections,
      badges: badges.map(b => b.name),
      recommendations,
      industryBenchmark
    };
  }

  private calculateBasicInfoScore(user: any): SectionScore {
    // Map database columns to expected field names
    const fields = [
      { field: 'firstname', value: user.firstname, required: true, points: 10 },
      { field: 'lastname', value: user.lastname, required: true, points: 10 },
      { field: 'email', value: user.email, required: true, points: 10 },
      { field: 'phone', value: user.phone, required: false, points: 5 },
      { field: 'location', value: user.location, required: false, points: 5 },
      { field: 'headline', value: user.title, required: false, points: 10 }, // 'title' column in DB
      { field: 'bio', value: user.bio, required: false, points: 10 },
      { field: 'experience_level', value: user.role, required: false, points: 10 } // 'role' column in DB
    ];

    let score = 0;
    const maxScore = fields.reduce((sum, f) => sum + f.points, 0);
    const requiredFields: { field: string; present: boolean; required: boolean }[] = [];

    fields.forEach(f => {
      const present = f.value && f.value.toString().trim().length > 0;
      if (present) score += f.points;
      requiredFields.push({ field: f.field, present, required: f.required });
    });

    const allRequired = fields.filter(f => f.required).every(f => 
      f.value && f.value.toString().trim().length > 0
    );

    return {
      name: 'Basic Information',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: allRequired,
      requiredFields
    };
  }

  private calculateEmploymentScore(employment: any[]): SectionScore {
    const maxScore = 100;
    let score = 0;

    // At least 1 employment entry required
    const requiredFields = [
      { field: 'at_least_one_entry', present: employment.length > 0, required: true }
    ];

    if (employment.length === 0) {
      return {
        name: 'Employment History',
        score: 0,
        maxScore,
        percentage: 0,
        completed: false,
        requiredFields
      };
    }

    // Base score for having entries
    score += Math.min(employment.length * 20, 40); // Up to 40 points for 2+ entries

    // Quality points
    employment.forEach(job => {
      if (job.title && job.title.length > 3) score += 10;
      if (job.company && job.company.length > 2) score += 10;
      if (job.description && job.description.length > 50) score += 15;
      if (job.start_date) score += 5;
      if (job.end_date || job.current) score += 5;
    });

    score = Math.min(score, maxScore);

    return {
      name: 'Employment History',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: employment.length > 0,
      requiredFields
    };
  }

  private calculateEducationScore(education: any[]): SectionScore {
    const maxScore = 80;
    let score = 0;

    const requiredFields = [
      { field: 'at_least_one_entry', present: education.length > 0, required: true }
    ];

    if (education.length === 0) {
      return {
        name: 'Education',
        score: 0,
        maxScore,
        percentage: 0,
        completed: false,
        requiredFields
      };
    }

    // Base score for having entries
    score += Math.min(education.length * 15, 30);

    // Quality points
    education.forEach(edu => {
      if (edu.degree && edu.degree.length > 3) score += 10;
      if (edu.institution && edu.institution.length > 3) score += 10;
      if (edu.field_of_study) score += 8;
      if (edu.start_date) score += 4;
      if (edu.end_date || edu.ongoing) score += 4;
      if (edu.gpa && edu.show_gpa) score += 4;
    });

    score = Math.min(score, maxScore);

    return {
      name: 'Education',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: education.length > 0,
      requiredFields
    };
  }

  private calculateSkillsScore(skills: any[]): SectionScore {
    const maxScore = 100;
    let score = 0;

    const requiredFields = [
      { field: 'at_least_three_skills', present: skills.length >= 3, required: true }
    ];

    if (skills.length === 0) {
      return {
        name: 'Skills',
        score: 0,
        maxScore,
        percentage: 0,
        completed: false,
        requiredFields
      };
    }

    // Base score for number of skills
    score += Math.min(skills.length * 8, 40); // Up to 40 points for 5+ skills

    // Quality points
    skills.forEach(skill => {
      if (skill.proficiency_level && skill.proficiency_level > 0) score += 8;
      if (skill.years_of_experience && skill.years_of_experience > 0) score += 6;
    });

    score = Math.min(score, maxScore);

    return {
      name: 'Skills',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: skills.length >= 3,
      requiredFields
    };
  }

  private calculateProjectsScore(projects: any[]): SectionScore {
    const maxScore = 80;
    let score = 0;

    const requiredFields = [
      { field: 'at_least_one_project', present: projects.length > 0, required: false }
    ];

    if (projects.length === 0) {
      return {
        name: 'Projects',
        score: 0,
        maxScore,
        percentage: 0,
        completed: true, // Not required
        requiredFields
      };
    }

    // Base score for having projects
    score += Math.min(projects.length * 12, 36);

    // Quality points
    projects.forEach(project => {
      if (project.name && project.name.length > 3) score += 8;
      if (project.description && project.description.length > 50) score += 10;
      if (project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0) score += 8;
      if (project.project_url) score += 6;
      if (project.github_url) score += 6;
      if (project.start_date) score += 3;
    });

    score = Math.min(score, maxScore);

    return {
      name: 'Projects',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: true,
      requiredFields
    };
  }

  private calculateCertificationsScore(certifications: any[]): SectionScore {
    const maxScore = 60;
    let score = 0;

    const requiredFields = [
      { field: 'has_certifications', present: certifications.length > 0, required: false }
    ];

    if (certifications.length === 0) {
      return {
        name: 'Certifications',
        score: 0,
        maxScore,
        percentage: 0,
        completed: true, // Not required
        requiredFields
      };
    }

    // Base score
    score += Math.min(certifications.length * 10, 30);

    // Quality points
    certifications.forEach(cert => {
      if (cert.name && cert.name.length > 3) score += 6;
      if (cert.issuing_organization) score += 6;
      if (cert.date_earned) score += 4;
      if (cert.certification_number) score += 3;
      if (cert.verification_status === 'VERIFIED') score += 6;
    });

    score = Math.min(score, maxScore);

    return {
      name: 'Certifications',
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      completed: true,
      requiredFields
    };
  }

  private determineBadges(score: number): Array<{ name: string; icon: string }> {
    return this.BADGE_THRESHOLDS
      .filter(badge => score >= badge.threshold)
      .map(badge => ({ name: badge.name, icon: badge.icon }));
  }

  private generateRecommendations(sections: any, user: any): string[] {
    const recommendations: string[] = [];

    // Basic Info recommendations
    if (sections.basicInfo.percentage < 80) {
      if (!user.title) recommendations.push('Add a professional headline to make a strong first impression');
      if (!user.bio || user.bio.length < 100) recommendations.push('Write a compelling bio (at least 100 characters) highlighting your expertise');
      if (!user.phone) recommendations.push('Add your phone number for better networking opportunities');
      if (!user.location) recommendations.push('Add your location to help with local job matching');
      if (!user.role) recommendations.push('Specify your experience level to attract appropriate opportunities');
    }

    // Employment recommendations
    if (sections.employment.percentage < 70) {
      if (sections.employment.score === 0) {
        recommendations.push('Add at least one employment entry to showcase your experience');
      } else {
        recommendations.push('Enhance your employment entries with detailed descriptions (50+ characters)');
        recommendations.push('Add more employment history to demonstrate career progression');
      }
    }

    // Education recommendations
    if (sections.education.percentage < 70) {
      if (sections.education.score === 0) {
        recommendations.push('Add your education background to strengthen your profile');
      } else {
        recommendations.push('Include your GPA (if above 3.0) and field of study for each degree');
      }
    }

    // Skills recommendations
    if (sections.skills.percentage < 70) {
      if (sections.skills.score === 0) {
        recommendations.push('Add at least 5-10 relevant skills to improve job matching');
      } else {
        recommendations.push('Add proficiency levels and years of experience for each skill');
        recommendations.push('Add more skills - aim for at least 8-10 relevant skills');
      }
    }

    // Projects recommendations
    if (sections.projects.percentage < 50) {
      recommendations.push('Add 2-3 projects to demonstrate your practical experience');
      recommendations.push('Include project descriptions, technologies used, and links to GitHub/live demos');
    }

    // Certifications recommendations
    if (sections.certifications.percentage < 40) {
      recommendations.push('Add relevant certifications to stand out from other candidates');
      recommendations.push('Include certification numbers and verification links when available');
    }

    // General recommendations based on overall score
    const sectionArray = Object.values(sections) as SectionScore[];
    const overallPercentage = Math.round(
      sectionArray.reduce((sum: number, s: SectionScore) => sum + s.percentage, 0) / 
      sectionArray.length
    );

    if (overallPercentage < 50) {
      recommendations.unshift('🎯 Priority: Focus on completing required fields in Basic Info and Employment sections');
    } else if (overallPercentage < 75) {
      recommendations.push('💡 Tip: Profiles with 75%+ completion get 3x more recruiter views');
    }

    return recommendations.slice(0, 8); // Return top 8 recommendations
  }

  private calculateIndustryBenchmark(userScore: number, industry: string): any {
    const industryAverage = this.INDUSTRY_BENCHMARKS[industry.toLowerCase()] || 
                           this.INDUSTRY_BENCHMARKS.default;
    
    // Calculate percentile (simplified)
    let percentile = 50;
    if (userScore >= industryAverage + 15) percentile = 90;
    else if (userScore >= industryAverage + 10) percentile = 80;
    else if (userScore >= industryAverage + 5) percentile = 70;
    else if (userScore >= industryAverage) percentile = 60;
    else if (userScore >= industryAverage - 5) percentile = 40;
    else if (userScore >= industryAverage - 10) percentile = 30;
    else if (userScore >= industryAverage - 15) percentile = 20;
    else percentile = 10;

    return {
      userScore,
      industryAverage,
      percentile
    };
  }

  private async saveCompleteness(userId: string, data: any): Promise<void> {
    const client = this.supabase.getClient();
    
    // Check if record exists
    const { data: existing } = await client
      .from('profile_completeness_metrics')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing record
      await client
        .from('profile_completeness_metrics')
        .update({
          overall_score: data.overall_score,
          section_scores: data.section_scores,
          badges_earned: data.badges_earned,
          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Insert new record
      await client
        .from('profile_completeness_metrics')
        .insert({
          user_id: userId,
          overall_score: data.overall_score,
          section_scores: data.section_scores,
          badges_earned: data.badges_earned,
          last_calculated_at: new Date().toISOString()
        });
    }
  }
}
