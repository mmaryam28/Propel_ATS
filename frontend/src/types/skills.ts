export type SkillCategory = 'Technical' | 'Soft Skills' | 'Languages' | 'Industry-Specific';
export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  order: number;
}

export const SKILL_CATEGORIES: SkillCategory[] = ['Technical','Soft Skills','Languages','Industry-Specific'];
export const PROFICIENCY_LEVELS: SkillProficiency[] = ['Beginner','Intermediate','Advanced','Expert'];

export const COMMON_SKILLS: Record<SkillCategory, string[]> = {
  Technical: ['Python','JavaScript','TypeScript','React','Node.js','SQL','AWS','Docker','Git','CI/CD'],
  'Soft Skills': ['Teamwork','Communication','Leadership','Time Management','Problem Solving','Adaptability'],
  Languages: ['English','Spanish','French','German','Mandarin','Arabic'],
  'Industry-Specific': ['HIPAA','FINRA','SOC 2','Agile','Scrum','FDA 21 CFR Part 11'],
};
