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


    // 1️⃣ Get user skills (auto-join with skills via FK)
    const { data: userSkillsData, error: userSkillsError } = await supabase
      .from("user_skills")
      .select("level, skills(name)") // dot-notation join
      .eq("user_id", userId);

    if (userSkillsError) throw userSkillsError;
    if (!userSkillsData || userSkillsData.length === 0) {
      return { error: "No skills found for this user." };
    }

    // Map to { skillName: level }
    const userSkills: Record<string, number> = Object.fromEntries(
      userSkillsData.map((row: any) => [
        row.skills?.name?.toLowerCase() ?? "unknown",
        row.level ?? 0,
      ])
    );

    // 2️⃣ Get job skills (auto-join with skills via FK)
    const { data: jobSkillsData, error: jobSkillsError } = await supabase
      .from("job_skills")
      .select("req_level, weight, skills(name)")
      .eq("job_id", jobId);

    if (jobSkillsError) throw jobSkillsError;
    if (!jobSkillsData || jobSkillsData.length === 0) {
      return { error: "No skill requirements found for this job." };
    }

    // 3️⃣ Compute match score
    let totalWeight = 0;
    let weightedScore = 0;
    const strengths: string[] = [];
    const gaps: Gap[] = [];
    const skillBreakdown: Record<string, { have: number; need: number; score: number }> = {};

    for (const js of jobSkillsData) {
  // Supabase might return skills as an array — handle both cases
  const skillRecord = Array.isArray(js.skills) ? js.skills[0] : js.skills;
  const skillName =
    skillRecord?.name && typeof skillRecord.name === "string"
      ? skillRecord.name.toLowerCase()
      : "unknown";

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



    const skillScore = totalWeight ? weightedScore / totalWeight : 0;

    // 4️⃣ Get user weighting preferences
    const { data: weightsData, error: weightsError } = await supabase
      .from("user_weights")
      .select()
      .eq("user_id", userId)
      .single();

    if (weightsError && weightsError.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      throw weightsError;
    }

    const skillsWeight = weightsData?.skills_weight ?? 0.7;
    const expWeight = weightsData?.experience_weight ?? 0.2;
    const eduWeight = weightsData?.education_weight ?? 0.1;

    // 5️⃣ Temporary experience/education placeholder
    const experienceScore = 100;
    const educationScore = 100;

    const total =
      skillScore * skillsWeight +
      experienceScore * expWeight +
      educationScore * eduWeight;

    const breakdown = {
      skills: skillScore,
      experience: experienceScore,
      education: educationScore,
      strengths,
      gaps,
      skillDetails: skillBreakdown,
    };

    // 6️⃣ Log match run (optional)
    const { error: insertError } = await supabase.from("match_runs").insert([
      {
        user_id: userId,
        job_id: jobId,
        score: total,
        breakdown,
      },
    ]);

    if (insertError) {
      console.warn("⚠️ Could not log match run:", insertError.message);
    }

    // 7️⃣ Return the final result
    return {
      score: Math.round(total),
      breakdown,
    };
  }

// 🧩 UC-066: Skills Gap Analysis (Enhanced)
async getSkillGaps(userId: string, jobId: string) {
  const supabase = this.supabaseService.getClient();

  // 1️⃣ Fetch user's skills
  const { data: userSkills, error: userErr } = await supabase
    .from("user_skills")
    .select("level, skills(name)")
    .eq("user_id", userId);

  if (userErr) throw userErr;

  const skillMap = Object.fromEntries(
    (userSkills || []).map((row: any) => [
      row.skills?.name?.toLowerCase(),
      row.level ?? 0,
    ])
  );

  // 2️⃣ Fetch job's required skills
  const { data: jobSkills, error: jobErr } = await supabase
    .from("job_skills")
    .select("req_level, skills(name)")
    .eq("job_id", jobId);

  if (jobErr) throw jobErr;

  // 3️⃣ Identify and score gaps
  const gaps = (jobSkills || [])
    .map((js: any) => {
      const skillName = js.skills?.name?.toLowerCase() ?? "unknown";
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
        .ilike("skill_name", `%${gap.skill}%`)
        .order("difficulty", { ascending: true })
        .limit(3);
      return { ...gap, resources: resources || [] };
    })
  );

  // 5️⃣ Separate strengths (for optional display)
  const strengths = (jobSkills || [])
    .map((js: any) => {
      const skillName = js.skills?.name?.toLowerCase();
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


}

