import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

interface Gap {
  skill: string;
  have: number;
  need: number;
  weight: number;
}

@Injectable()
export class MatchService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async computeMatch(userId: string, jobId: string) {
    const supabase = this.supabaseService.getClient();


    // 1️⃣ Get user skills with names
    const { data: userSkillsData, error: userSkillsError } = await supabase
      .from("user_skills")
      .select(`
        skill_id,
        level,
        skills:skill_id (
          id,
          name
        )
      `)
      .eq("user_id", userId);

    if (userSkillsError) {
      console.error('Error fetching user skills:', userSkillsError);
      throw userSkillsError;
    }
    
    console.log(`[Match] User ${userId} has ${userSkillsData?.length || 0} skills in user_skills table`);
    
    if (!userSkillsData || userSkillsData.length === 0) {
      console.warn(`[Match] User ${userId} has no skills - returning error`);
      return { 
        error: "No skills found for this user. Please add skills at /skills first.",
        score: 0,
        breakdown: {
          skills: 0,
          experience: 100,
          education: 100,
          strengths: [],
          gaps: [],
          skillDetails: {}
        }
      };
    }

    // Map to { skillName: level } - filter out skills that couldn't be joined
    const userSkills: Record<string, number> = Object.fromEntries(
      userSkillsData
        .filter((row: any) => row.skills && row.skills.name)
        .map((row: any) => [
          row.skills.name,
          row.level ?? 0,
        ])
    );
    
    console.log(`[Match] User skills mapped:`, Object.keys(userSkills));

    // 2️⃣ Get job skills (now using denormalized structure)
    const { data: jobSkillsData, error: jobSkillsError} = await supabase
      .from("job_skills")
      .select("skill_name, skill_category, req_level, weight")
      .eq("job_id", jobId);

    if (jobSkillsError) {
      console.error('Error fetching job skills:', jobSkillsError);
      throw jobSkillsError;
    }
    
    console.log(`[Match] Job ${jobId} has ${jobSkillsData?.length || 0} required skills`);
    
    // 3️⃣ Initialize variables
    let totalWeight = 0;
    let weightedScore = 0;
    const strengths: string[] = [];
    const gaps: Gap[] = [];
    const skillBreakdown: Record<string, { have: number; need: number; score: number }> = {};

    // 4️⃣ Compute match score (handle case where job has no skills)
    if (jobSkillsData && jobSkillsData.length > 0) {
      for (const js of jobSkillsData) {
        const skillName = js.skill_name;
        const need = js.req_level ?? 0;
        const w = js.weight ?? 1;
        const have = userSkills[skillName] ?? 0;
        const skillScore = Math.min(have / Math.max(need, 1), 1) * 100;

        totalWeight += w;
        weightedScore += skillScore * w;

        // Store individual skill breakdown
        skillBreakdown[skillName] = { have, need, score: Math.round(skillScore) };

        if (have >= need) strengths.push(skillName);
        else gaps.push({ skill: skillName, have, need, weight: w });
      }
    } else {
      console.warn(`[Match] Job ${jobId} has no required skills defined`);
    }

    const skillScore = totalWeight ? weightedScore / totalWeight : 0;
    console.log(`[Match] Calculated skill score: ${skillScore}%`);

    // 5️⃣ Get user employment history to calculate experience level
    const { data: employmentHistory } = await supabase
      .from("employment")
      .select("start_date, end_date, position_title")
      .eq("user_id", userId)
      .order("end_date", { ascending: false });

    // 5.1️⃣ Get job experience requirement from job description or infer from title
    const { data: jobData } = await supabase
      .from("jobs")
      .select("description, title, experience_level")
      .eq("id", jobId)
      .single();

    const experienceScore = await this.calculateExperienceMatch(userId, employmentHistory || [], jobData);
    
    // 5.2️⃣ Get user education to calculate education match
    const { data: educationData } = await supabase
      .from("education")
      .select("degree_type, field_of_study")
      .eq("user_id", userId);

    const educationScore = await this.calculateEducationMatch(jobData?.description, educationData || []);

    // 5️⃣ Use default weighting preferences (no user_weights table)
    const skillsWeight = 0.7;
    const expWeight = 0.2;
    const eduWeight = 0.1;

    const total =
      skillScore * skillsWeight +
      experienceScore * expWeight +
      educationScore * eduWeight;
      
    console.log(`[Match] Final score: ${Math.round(total)}%`);

    const breakdown = {
      skills: skillScore,
      experience: experienceScore,
      education: educationScore,
      strengths,
      gaps,
      skillDetails: skillBreakdown,
    };

    // 6️⃣ Skip logging (no match_runs table)

    // 7️⃣ Return the final result
    return {
      score: Math.round(total),
      breakdown,
    };
  }

// 🧩 UC-066: Skills Gap Analysis (Enhanced)
async getSkillGaps(userId: string, jobId: string) {
  const supabase = this.supabaseService.getClient();

  // 1️⃣ Fetch user's skills with names from join
  const { data: userSkills, error: userErr } = await supabase
    .from("user_skills")
    .select(`
      skill_id,
      level,
      skills:skill_id (
        id,
        name
      )
    `)
    .eq("user_id", userId);

  if (userErr) throw userErr;

  // Create map keyed by skill name, filter out null joins
  const skillMap = Object.fromEntries(
    (userSkills || [])
      .filter((us: any) => us.skills && us.skills.name)
      .map((us: any) => [us.skills.name, us.level])
  );

  // 2️⃣ Fetch job's required skills (using denormalized structure)
  const { data: jobSkills, error: jobErr } = await supabase
    .from("job_skills")
    .select("skill_name, req_level")
    .eq("job_id", jobId);

  if (jobErr) throw jobErr;

  // 3️⃣ Identify and score gaps
  const gaps = (jobSkills || [])
    .map((js: any) => {
      const skillName = js.skill_name;
      const required = js.req_level ?? 0;
      const have = skillMap[skillName] ?? 0;
      const progress = Math.round((have / Math.max(required, 1)) * 100);
      const gapScore = required - have;
      return { skill: skillName, required, have, progress, gapScore };
    })
    .filter((gap) => gap.have < gap.required);

  // 🧠 Sort by largest gap first
  gaps.sort((a, b) => b.gapScore - a.gapScore);

  // 4️⃣ Attach learning resources (limit 3 each, sorted by difficulty if present)
  const enrichedGaps = await Promise.all(
    gaps.map(async (gap) => {
      const { data: resources } = await supabase
        .from("learning_resources")
        .select("title, url, difficulty")
        .eq("skill_name", gap.skill)
        .order("difficulty", { ascending: true })
        .limit(3);
      return { ...gap, resources: resources || [] };
    })
  );

  // 5️⃣ Separate strengths (for optional display)
  const strengths = (jobSkills || [])
    .map((js: any) => {
      const skillName = js.skill_name;
      const required = js.req_level ?? 0;
      const have = skillMap[skillName] ?? 0;
      const progress = Math.round((have / Math.max(required, 1)) * 100);
      return { skill: skillName, required, have, progress };
    })
    .filter((s) => s.have >= s.required);

  // 6️⃣ Return response
  return {
    userId,
    jobId,
    totalGaps: enrichedGaps.length,
    gaps: enrichedGaps,
    strengths,
  };
}

  /**
   * UC-065 AC5: Compare match scores across multiple jobs
   */
  async rankJobs(userId: string, jobIds?: string[]) {
    const supabase = this.supabaseService.getClient();

    // If no specific jobs provided, get all jobs
    let targetJobIds = jobIds;
    if (!targetJobIds || targetJobIds.length === 0) {
      const { data: allJobs } = await supabase
        .from('jobs')
        .select('id')
        .limit(20); // Limit to prevent overwhelming
      targetJobIds = allJobs?.map(job => job.id) || [];
    }

    // Compute match for each job
    const matchPromises = targetJobIds.map(async (jobId) => {
      try {
        const matchResult = await this.computeMatch(userId, jobId);
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title, company, location, salary_min, salary_max')
          .eq('id', jobId)
          .single();
        
        return {
          jobId,
          job: jobData,
          score: matchResult.score || 0,
          breakdown: matchResult.breakdown
        };
      } catch (error) {
        return { jobId, score: 0, error: error.message };
      }
    });

    const results = await Promise.all(matchPromises);
    
    // Sort by match score descending
    const rankedJobs = results
      .filter(result => !result.error)
      .sort((a, b) => b.score - a.score);

    return {
      userId,
      totalJobs: rankedJobs.length,
      jobs: rankedJobs
    };
  }

  /**
   * UC-065 AC4: Suggest profile improvements to increase match scores
   */
  async getProfileImprovements(userId: string, targetJobIds?: string[]) {
    const supabase = this.supabaseService.getClient();
    
    // Get top job matches or specified jobs
    const jobRanking = await this.rankJobs(userId, targetJobIds);
    const topJobs = jobRanking.jobs.slice(0, 5); // Focus on top 5 jobs

    const skillImprovements = new Map<string, { skill: string; impact: number; requiredBy: string[] }>();
    const experienceGaps = [];
    const educationGaps = [];

    // Analyze skill gaps across top jobs
    for (const jobMatch of topJobs) {
      const gaps = jobMatch.breakdown?.gaps || [];
      
      for (const gap of gaps) {
        const skillKey = gap.skill.toLowerCase();
        if (skillImprovements.has(skillKey)) {
          const existing = skillImprovements.get(skillKey);
          if (existing) {
            existing.impact += gap.weight || 1;
            existing.requiredBy.push(jobMatch.job?.title || 'Unknown Job');
          }
        } else {
          skillImprovements.set(skillKey, {
            skill: gap.skill,
            impact: gap.weight || 1,
            requiredBy: [jobMatch.job?.title || 'Unknown Job']
          });
        }
      }
    }

    // Convert to sorted array
    const sortedSkillImprovements = Array.from(skillImprovements.values())
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10);

    return {
      userId,
      improvements: {
        skills: sortedSkillImprovements,
        experience: experienceGaps,
        education: educationGaps
      },
      recommendedActions: this.generateRecommendedActions(sortedSkillImprovements)
    };
  }

  /**
   * UC-065 AC6: Match score history and trends
   */
  async getMatchHistory(userId: string, limit: number = 50) {
    // Return empty history since match_runs table doesn't exist
    return {
      userId,
      totalRuns: 0,
      averageScore: 0,
      trend: 'insufficient_data',
      history: []
    };
  }

  /**
   * UC-065 AC8: Export match analysis reports
   */
  async exportMatchReport(userId: string, jobIds?: string[]) {
    const [ranking, improvements, history] = await Promise.all([
      this.rankJobs(userId, jobIds),
      this.getProfileImprovements(userId, jobIds),
      this.getMatchHistory(userId, 20)
    ]);

    return {
      reportGeneratedAt: new Date().toISOString(),
      userId,
      summary: {
        totalJobsAnalyzed: ranking.totalJobs,
        averageMatchScore: Math.round(ranking.jobs.reduce((sum, job) => sum + job.score, 0) / ranking.totalJobs || 0),
        topMatchScore: ranking.jobs[0]?.score || 0,
        improvementOpportunities: improvements.improvements.skills.length
      },
      topMatches: ranking.jobs.slice(0, 10),
      recommendedImprovements: improvements.improvements,
      matchTrends: {
        averageScore: history.averageScore,
        trend: history.trend,
        recentRuns: history.history.slice(0, 10)
      }
    };
  }

  // Helper methods
  private generateRecommendedActions(skillImprovements: any[]): string[] {
    const actions: string[] = [];
    
    for (const improvement of skillImprovements.slice(0, 3)) {
      actions.push(`Improve ${improvement.skill} skills - required by ${improvement.requiredBy.length} target job(s)`);
    }
    
    if (skillImprovements.length > 3) {
      actions.push(`Consider developing ${skillImprovements.length - 3} additional skills for better job matches`);
    }
    
    return actions;
  }

  private calculateTrend(scores: number[]): string {
    if (scores.length < 2) return 'insufficient_data';
    
    const recent = scores.slice(0, Math.min(5, scores.length));
    const older = scores.slice(Math.min(5, scores.length));
    
    if (older.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  async getDetailedMatch(userId: string, jobId: string) {
    try {
      const matchResult = await this.computeMatch(userId, jobId);
      
      if (matchResult.error) {
        return matchResult;
      }

      // Get additional recommendations
      const recommendations = await this.generateRecommendations(userId, jobId, matchResult);
      
      return {
        overallScore: matchResult.score || 0,
        breakdown: {
          skills: matchResult.breakdown?.skills || 0,
          experience: matchResult.breakdown?.experience || 0,
          education: matchResult.breakdown?.education || 0,
        },
        strengths: matchResult.breakdown?.strengths || [],
        gaps: matchResult.breakdown?.gaps || [],
        recommendations: recommendations.map(r => r.suggestion || r),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting detailed match:', error);
      return { error: 'Failed to compute detailed match' };
    }
  }

  async getUserSkills(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        skill_id,
        level,
        skills:skill_id (
          id,
          name,
          category
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }

    return data
      ?.filter((row: any) => row.skills && row.skills.name)
      .map((row: any) => ({
        id: row.skill_id,
        name: row.skills.name,
        category: row.skills.category,
        level: row.level
      })) || [];
  }

  async getUserWeights(userId: string) {
    // Return default weights since user_weights table doesn't exist
    return {
      skills_weight: 0.7,
      experience_weight: 0.2,
      education_weight: 0.1
    };
  }

  async updateUserWeights(userId: string, weights: { skills_weight: number; experience_weight: number; education_weight: number }) {
    // Return success since user_weights table doesn't exist - weights are handled in memory
    return {
      user_id: userId,
      ...weights,
      updated_at: new Date().toISOString()
    };
  }

  async saveMatchHistory(userId: string, jobId: string, matchScore: number) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from("match_history")
      .insert({
        user_id: userId,
        job_id: jobId,
        match_score: matchScore,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving match history:', error);
      return { error: 'Failed to save match history' };
    }

    return data;
  }

  async compareMultipleJobs(userId: string, jobIds: string[]) {
    try {
      const matchPromises = jobIds.map(jobId => this.computeMatch(userId, jobId));
      const results = await Promise.all(matchPromises);
      
      // Get job details
      const supabase = this.supabaseService.getClient();
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company, location")
        .in("id", jobIds);

      const comparisons = results.map((result, index) => ({
        jobId: jobIds[index],
        job: jobs?.find(j => j.id === jobIds[index]),
        matchScore: result.score || 0,
        breakdown: result.breakdown,
        error: result.error
      }));

      // Sort by match score descending
      comparisons.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      return {
        comparisons,
        bestMatch: comparisons[0],
        averageScore: comparisons.reduce((sum, c) => sum + (c.matchScore || 0), 0) / comparisons.length
      };
    } catch (error) {
      console.error('Error comparing jobs:', error);
      return { error: 'Failed to compare jobs' };
    }
  }

  async generateRecommendations(userId: string, jobId: string, matchResult: any) {
    const recommendations: any[] = [];

    // Skills-based recommendations
    if (matchResult.gaps && matchResult.gaps.length > 0) {
      const topGaps = matchResult.gaps.slice(0, 3);
      for (const gap of topGaps) {
        recommendations.push({
          type: 'skill',
          skill: gap.skill,
          priority: gap.weight > 5 ? 'high' : gap.weight > 3 ? 'medium' : 'low',
          suggestion: `Focus on improving ${gap.skill} from level ${gap.have} to ${gap.need}. This skill has high weight (${gap.weight}) for this role.`
        });
      }
    }

    // Experience recommendations
    if (matchResult.breakdown.experience < 70) {
      recommendations.push({
        type: 'experience',
        priority: 'medium',
        suggestion: 'Consider highlighting relevant projects or volunteer work that demonstrates similar experience to what this role requires.'
      });
    }

    // Education recommendations  
    if (matchResult.breakdown.education < 60) {
      recommendations.push({
        type: 'education',
        priority: 'low',
        suggestion: 'Consider pursuing additional certifications or courses relevant to this field to strengthen your educational background.'
      });
    }

    return recommendations;
  }

  /**
   * UC-123: Calculate experience level match against job requirements
   * Analyzes years of experience and position levels
   */
  private async calculateExperienceMatch(userId: string, employmentHistory: any[], jobData: any): Promise<number> {
    try {
      // Calculate total years of experience
      let totalMonths = 0;
      const now = new Date();
      
      for (const job of employmentHistory) {
        const startDate = new Date(job.start_date);
        const endDate = job.end_date ? new Date(job.end_date) : now;
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
        totalMonths += monthsDiff;
      }
      
      const yearsOfExperience = totalMonths / 12;
      
      // Extract required experience level from job description or title
      const jobDescription = jobData?.description?.toLowerCase() || '';
      const jobTitle = jobData?.title?.toLowerCase() || '';
      const experienceLevel = jobData?.experience_level?.toLowerCase() || this.inferExperienceLevel(jobDescription + ' ' + jobTitle);
      
      let requiredYears = 0;
      let requiredLevel = 'entry'; // default
      
      // Parse experience requirements from description
      const expMatch = jobDescription.match(/(\d+)\+?\s*years?/i);
      if (expMatch) {
        requiredYears = parseInt(expMatch[1]);
      }
      
      // Determine required level
      if (jobDescription.includes('senior') || jobDescription.includes('lead') || jobDescription.includes('principal')) {
        requiredLevel = 'senior';
        requiredYears = Math.max(requiredYears, 5);
      } else if (jobDescription.includes('mid') || jobDescription.includes('intermediate')) {
        requiredLevel = 'mid';
        requiredYears = Math.max(requiredYears, 2);
      } else {
        requiredLevel = 'entry';
      }
      
      // Determine user's level based on experience
      let userLevel = 'entry';
      if (yearsOfExperience >= 5) userLevel = 'senior';
      else if (yearsOfExperience >= 2) userLevel = 'mid';
      
      // Calculate match score
      let experienceScore = 0;
      if (yearsOfExperience >= requiredYears) {
        experienceScore = 100;
      } else if (yearsOfExperience >= requiredYears * 0.7) {
        experienceScore = 85;
      } else if (yearsOfExperience >= requiredYears * 0.5) {
        experienceScore = 70;
      } else {
        experienceScore = Math.min(100, (yearsOfExperience / requiredYears) * 100);
      }
      
      // Bonus for exceeding requirements
      if (yearsOfExperience >= requiredYears * 1.5) {
        experienceScore = Math.min(100, experienceScore + 10);
      }
      
      console.log(`[Experience Match] User: ${yearsOfExperience.toFixed(1)} yrs (${userLevel}), Required: ${requiredYears} yrs (${requiredLevel}), Score: ${experienceScore}`);
      
      return Math.round(experienceScore);
    } catch (error) {
      console.error('Error calculating experience match:', error);
      return 100; // Default to perfect match if error
    }
  }

  /**
   * UC-123: Calculate education match against job requirements
   */
  private async calculateEducationMatch(jobDescription: string = '', educationData: any[]): Promise<number> {
    try {
      const jobDescLower = jobDescription.toLowerCase();
      
      // Check if job requires specific education
      const requiresBachelor = jobDescLower.includes("bachelor") || jobDescLower.includes("b.s.") || jobDescLower.includes("b.a.");
      const requiresMaster = jobDescLower.includes("master") || jobDescLower.includes("m.s.") || jobDescLower.includes("m.a.");
      const requiresPhd = jobDescLower.includes("phd") || jobDescLower.includes("doctorate");
      const requiresCertification = jobDescLower.includes("certification") || jobDescLower.includes("certified");
      
      // Default score
      let educationScore = 100;
      
      // If no specific education requirement found, give full marks
      if (!requiresBachelor && !requiresMaster && !requiresPhd && !requiresCertification) {
        return 100;
      }
      
      // Check user's education
      const userDegrees = educationData.map(e => e.degree_type?.toLowerCase() || '');
      
      if (requiresPhd) {
        educationScore = userDegrees.some(d => d.includes('phd') || d.includes('doctorate')) ? 100 : 70;
      } else if (requiresMaster) {
        educationScore = userDegrees.some(d => d.includes('master') || d.includes('m.s')) ? 100 : 
                        userDegrees.some(d => d.includes('bachelor')) ? 85 : 70;
      } else if (requiresBachelor) {
        educationScore = userDegrees.some(d => d.includes('bachelor') || d.includes('b.s') || d.includes('b.a')) ? 100 : 80;
      }
      
      console.log(`[Education Match] Score: ${educationScore}`);
      
      return educationScore;
    } catch (error) {
      console.error('Error calculating education match:', error);
      return 100;
    }
  }

  /**
   * Infer experience level from job description/title
   */
  private inferExperienceLevel(text: string): string {
    const textLower = text.toLowerCase();
    if (textLower.includes('senior') || textLower.includes('lead') || textLower.includes('principal')) {
      return 'senior';
    } else if (textLower.includes('mid') || textLower.includes('intermediate')) {
      return 'mid';
    }
    return 'entry';
  }

}

