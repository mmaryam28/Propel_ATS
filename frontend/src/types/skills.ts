export type SkillCategory = 'Technical' | 'Soft Skills';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  order: number;
}

export const SKILL_CATEGORIES: SkillCategory[] = ['Technical', 'Soft Skills'];

export const COMMON_SKILLS: Record<SkillCategory, string[]> = {
  Technical: [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'PostgreSQL', 'MongoDB',
    'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST APIs', 'GraphQL',
    'HTML/CSS', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Rust'
  ],
  'Soft Skills': [
    'Teamwork', 'Communication', 'Leadership', 'Time Management', 'Problem Solving',
    'Adaptability', 'Critical Thinking', 'Creativity', 'English', 'Spanish', 'French',
    'German', 'Mandarin', 'Arabic', 'Project Management', 'Agile', 'Scrum'
  ],
};
