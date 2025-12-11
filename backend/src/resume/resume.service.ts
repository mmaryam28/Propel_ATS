import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { GenerateAIDto } from './dto/generate-ai.dto';
import axios from 'axios';
import * as fs from 'fs/promises';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import type { Multer } from 'multer';
import { PostgrestError } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';



@Injectable()
export class ResumeService {
  private ollamaUrl: string;

  constructor(private readonly supabase: SupabaseService) {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }
  private readonly model = process.env.OLLAMA_MODEL || 'phi3';

  //----------------------------------------------------
  // UTILITIES
  //----------------------------------------------------

  handleError(error: PostgrestError) {
    console.error('Supabase Error:', error);
    throw new BadRequestException(error.message);
  }

  async getUserById(userId: string) {
    console.log(`🔍 [getUserById] Querying users table for ID: ${userId}`);
    
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .select('firstname, lastname, email, phone')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [getUserById] Supabase error:', error);
      throw new NotFoundException(`User not found: ${error.message}`);
    }

    if (!data) {
      console.error('❌ [getUserById] No user data returned');
      throw new NotFoundException('User not found');
    }

    console.log(`✅ [getUserById] Found user:`, {
      name: `${data.firstname} ${data.lastname}`,
      email: data.email,
      hasPhone: !!data.phone,
    });

    return data;
  }

  async checkOllamaConnection() {
    console.log('\n🔍 [Health Check] Testing Ollama connection...');
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000,
      });
      const elapsed = Date.now() - startTime;
      
      console.log(`✅ Ollama is running at ${this.ollamaUrl}`);
      console.log(`📦 Available models:`, response.data?.models?.map(m => m.name) || []);
      
      return {
        status: 'connected',
        url: this.ollamaUrl,
        responseTime: `${elapsed}ms`,
        models: response.data?.models || [],
      };
    } catch (err) {
      console.error(`❌ Cannot connect to Ollama:`, err.message);
      return {
        status: 'error',
        url: this.ollamaUrl,
        error: err.message,
        suggestion: 'Make sure Ollama is running with: ollama serve',
      };
    }
  }

  private sanitizeAIResponse(text: string) {
    if (!text) return {};

    // Remove code fences
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Remove JS-style comments
    text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');

    // If not JSON, return raw
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      return { raw: text };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  //----------------------------------------------------
  // AI ENGINE - Your enhanced version with logging
  //----------------------------------------------------
  private async askAI(prompt: string) {
    const startTime = Date.now();
    console.log('\n🤖 [AI Request] Starting Ollama API call...');
    console.log(`📊 Prompt length: ${prompt.length} characters`);
    
    try {
      console.log(`🌐 Connecting to: ${this.ollamaUrl}/api/generate`);
      console.log(`🎯 Model: ${this.model}`);
      
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048, // Increased from 512 to avoid truncation
          num_ctx: 4096, // Context window size
        }
      }, {
        timeout: 300000, // 5 minutes timeout for larger responses
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [AI Response] Received in ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s)`);
      
      const raw = response.data?.response ?? '';
      console.log(`📝 Response length: ${raw.length} characters`);
      
      const sanitized = this.sanitizeAIResponse(raw);
      console.log(`✨ Sanitized response type: ${typeof sanitized}`);
      
      return sanitized;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [AI Error] Failed after ${elapsed}ms:`, err.message);
      if (err.code === 'ECONNREFUSED') {
        console.error('🚨 Cannot connect to Ollama. Is it running on', this.ollamaUrl, '?');
      }
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
        console.error('⏱️  Request timed out after 5 minutes. The phi3 model may be too slow.');
        console.error('💡 Suggestion: Try using a faster model like "llama3.2" or "mistral"');
        console.error('   Set OLLAMA_MODEL=llama3.2 in your .env file');
      }
      return { error: 'AI parsing failed', raw: err.message };
    }
  }

  //----------------------------------------------------
  // AI ENGINE - Teammate's fetch-based version for compatibility
  //----------------------------------------------------
  private async callAI(prompt: string) {
    try {
      const res = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        console.error('Ollama API Error:', await res.text());
        return { error: 'Failed to generate AI content.' };
      }

      const data: any = await res.json();
      const raw = (data.response || '').trim();

      return this.sanitizeAIResponse(raw);
    } catch (err) {
      console.error('AI Error:', err);
      return { error: 'AI request failed', raw: err.message };
    }
  }



  //----------------------------------------------------
  // CRUD WITH CAMELCASE OUTPUT
  //----------------------------------------------------

  async create(dto: CreateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert({
        userid: dto.userId,
        title: dto.title,
        aicontent: dto.aiContent ?? {},
        experience: dto.experience ?? {},
        skills: dto.skills ?? {},
        sections: dto.sections ?? {},
      })
      .select('*')
      .single();

    if (error) this.handleError(error);

    return this.mapResume(data);
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('userid', userId);

    if (error) this.handleError(error);
    return (data ?? []).map(r => this.mapResume(r));
  }

  async findOne(id: string) {
    if (!id || id === 'undefined')
      throw new BadRequestException('Invalid resume ID');

    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .select('*')
      .eq('id', id)
      .single();

    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Resume not found');

    return this.mapResume(data);
  }

  async update(id: string, dto: UpdateResumeDto) {
    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .update({
        userid: dto.userId,
        title: dto.title,
        aicontent: dto.aiContent,
        skills: dto.skills,
        experience: dto.experience,
        sections: dto.sections,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) this.handleError(error);
    return this.mapResume(data);
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('Resume')
      .delete()
      .eq('id', id);

    if (error) this.handleError(error);
    return { message: 'Resume deleted' };
  }

  //----------------------------------------------------
  // TEMPLATE MANAGEMENT
  //----------------------------------------------------
  async getTemplates() {
    const { data, error } = await this.supabase
      .getClient()
      .from('ResumeTemplate')
      .select('*');

    if (error) this.handleError(error);
    return { templates: data ?? [] };
  }

  //----------------------------------------------------
  // AI FEATURES
  //----------------------------------------------------
  async generateAI(dto: GenerateAIDto) {
    console.log('\n🎨 [Generate AI] Starting resume generation...');
    console.log(`📋 Job description length: ${dto.jobDescription?.length || 0} chars`);
    console.log(`👤 User profile keys:`, Object.keys(dto.userProfile || {}));
    console.log(`📄 Template type: ${dto.templateType || 'default'}`);
    
    const startTime = Date.now();
    
    // Check if user has projects
    const hasProjects = dto.userProfile?.projects && Array.isArray(dto.userProfile.projects) && dto.userProfile.projects.length > 0;
    const projectsInstruction = hasProjects 
      ? `Use the existing projects from the user profile and enhance them.` 
      : `IMPORTANT: Since the user has no projects listed, create 2-3 relevant technical projects that would be appropriate for this role. Make them realistic and aligned with the job requirements. Include specific technologies, achievements, and outcomes.`;
    
    // Use template-based prompt if templateType is provided
    if (dto.templateType) {
      const prompt = `
  You are a professional resume writer.  
  Generate resume content in clean JSON ONLY, using this template type:

  TEMPLATE TYPE: ${dto.templateType.toUpperCase()}

  Job Description:
  ${dto.jobDescription}

  User Profile:
  ${JSON.stringify(dto.userProfile, null, 2)}

  ==============================
  TEMPLATE RULES
  ==============================

  If the template is **CHRONOLOGICAL**:
  Return JSON with:
  {
    "header": {...},
    "summary": "string",
    "experience": [
      {
        "title": "string",
        "company": "string",
        "location": "string",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM or Present",
        "bullets": ["action bullet", ...]
      }
    ],
    "skills": {
      "technical": [...],
      "soft": [...],
      "tools": [...]
    },
    "education": [...]
  }

  If the template is **FUNCTIONAL**:
  Return JSON with:
  {
    "header": {...},
    "summary": "string",
    "skillsSummary": [
      {
        "category": "Skill Area",
        "details": ["skill", "skill", ...]
      }
    ],
    "achievements": ["bullet", "bullet"],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "notes": ["short, factual notes without full bullets"]
      }
    ],
    "education": [...]
  }

  If the template is **HYBRID**:
  Return JSON with:
  {
    "header": {...},
    "summary": "string",
    "skillsSummary": [
      {
        "category": "Skill Area",
        "details": ["skill", "skill"]
      }
    ],
    "experience": [
      {
        "title": "string",
        "company": "string",
        "startDate": "YYYY-MM",
        "endDate": "YYYY-MM or Present",
        "bullets": ["metric-based bullet", ...]
      }
    ],
    "projects": [
      {
        "name": "string",
        "description": "string",
        "tech": ["React", "Node", ...]
      }
    ],
    "education": [...]
  }

  ==============================
  INSTRUCTIONS
  ==============================
  - RETURN JSON ONLY — NO explanation.
  - Do NOT create fake experience or fake roles.
  - Improve clarity, impact, and alignment with job description.
  - Use strong action verbs and measurable outcomes where possible.
  - ${projectsInstruction}
  `;

      const result = await this.callAI(prompt);
      const elapsed = Date.now() - startTime;
      console.log(`✅ [Generate AI] Completed in ${(elapsed / 1000).toFixed(2)}s`);
      
      return { aiContent: result };
    }

    // Default prompt (your original enhanced version with NJIT and auto-projects)
    const prompt = `You are a professional resume writer. Generate optimized resume content based on the user's profile and job description.

Job Description:
${dto.jobDescription}

User Profile:
${JSON.stringify(dto.userProfile, null, 2)}

IMPORTANT INSTRUCTIONS:
- If education institution is not specified, use "New Jersey Institute of Technology (NJIT)" as the default school
- ${projectsInstruction}
- Use the user's actual name from the profile: ${dto.userProfile?.name || 'Professional'}

Generate a JSON object with the following structure:
{
  "sections": {
    "summary": "A compelling professional summary tailored to the job (2-3 sentences)",
    "education": [
      {
        "degree": "Degree name (e.g., Bachelor of Science in Computer Science)",
        "institution": "New Jersey Institute of Technology (NJIT)",
        "location": "Newark, NJ",
        "graduationDate": "Expected May 2026",
        "gpa": "3.5",
        "relevantCourses": ["Data Structures", "Algorithms", "Database Systems"]
      }
    ],
    "experience": [
      {
        "title": "Job title",
        "company": "Company name",
        "location": "Location",
        "startDate": "Start date",
        "endDate": "End date or 'Present'",
        "achievements": [
          "Quantified achievement with metrics (e.g., Increased efficiency by 30%)",
          "Another achievement with impact and numbers"
        ]
      }
    ],
    "projects": [
      {
        "name": "Project name (e.g., E-Commerce Platform, Task Management System)",
        "description": "1-2 sentence description of what the project does",
        "technologies": ["React", "Node.js", "PostgreSQL", "Docker"],
        "achievements": [
          "Specific achievement with metrics (e.g., Handles 1000+ concurrent users)",
          "Technical accomplishment (e.g., Implemented JWT authentication and role-based access)"
        ]
      }
    ]
  },
  "skills": {
    "technical": ["skill1", "skill2", "skill3"],
    "languages": ["JavaScript", "Python", "Java"],
    "frameworks": ["React", "Node.js", "Express"],
    "tools": ["Git", "Docker", "AWS"]
  }
}

Return ONLY valid JSON with optimized content tailored to the job description. Focus on quantifiable achievements and relevant keywords from the job posting. Make sure projects are realistic and demonstrate relevant skills for the role.`;

    const result = await this.askAI(prompt);
    const elapsed = Date.now() - startTime;
    console.log(`✅ [Generate AI] Completed in ${(elapsed / 1000).toFixed(2)}s`);
    
    return { aiContent: result };
  }


  async optimizeSkills(dto: GenerateAIDto) {
    const prompt = `Analyze this job description and optimize the skills list to match.

Job Description:
${dto.jobDescription}

Current Skills:
${JSON.stringify(dto.userProfile.skills, null, 2)}

Return a JSON object with optimized skills grouped by category:
{
  "technical": ["relevant technical skills from job description"],
  "languages": ["programming languages"],
  "frameworks": ["frameworks and libraries"],
  "tools": ["development tools"],
  "soft": ["soft skills mentioned in job description"]
}

Prioritize skills that match the job description. Return ONLY valid JSON.`;

    return { optimization: await this.askAI(prompt) };
  }


  async tailorExperience(dto: GenerateAIDto) {
    const prompt = `Rewrite the work experience to align with this job description using action verbs and quantifiable achievements.

Job Description:
${dto.jobDescription}

Current Experience:
${JSON.stringify(dto.userProfile.experience, null, 2)}

Return a JSON array of experience entries:
[
  {
    "title": "Job title",
    "company": "Company name",
    "location": "Location",
    "startDate": "Start date",
    "endDate": "End date or Present",
    "achievements": [
      "Achievement with metrics (e.g., Increased performance by 40%)",
      "Another quantified achievement",
      "Use action verbs: Led, Developed, Implemented, Optimized"
    ]
  }
]

Focus on achievements relevant to the target job. Use keywords from the job description. Return ONLY valid JSON.`;

    return { tailored: await this.askAI(prompt) };
  }


  async validateResume(userProfile: any) {
    const prompt = `Evaluate this resume and provide specific feedback for improvement.

Resume Content:
${JSON.stringify(userProfile, null, 2)}

Return a JSON object with validation results:
{
  "overallScore": 85,
  "strengths": [
    "Specific strength with example",
    "Another strength"
  ],
  "improvements": [
    "Specific actionable improvement",
    "Another improvement with example"
  ],
  "missing": [
    "Missing element that should be added",
    "Another missing element"
  ],
  "atsScore": 90,
  "atsIssues": [
    "Specific ATS compatibility issue if any"
  ]
}

Provide constructive, actionable feedback. Return ONLY valid JSON.`;

    return { validation: await this.askAI(prompt) };
  }

  //----------------------------------------------------
  // PDF GENERATION
  //----------------------------------------------------
  async generatePDF(resumeData: any): Promise<Buffer> {
    console.log('📄 [PDF Generator] Starting PDF generation...');
    console.log('📊 Resume data structure:', JSON.stringify(resumeData, null, 2));
    console.log('📊 Resume keys:', Object.keys(resumeData));
    console.log('📊 Has aiContent?', !!resumeData.aiContent, typeof resumeData.aiContent);
    
    // If data is in aiContent field, use that
    let contentData = resumeData;
    if (resumeData.aiContent && typeof resumeData.aiContent === 'object') {
      console.log('📊 Using aiContent as data source');
      contentData = resumeData.aiContent;
    } else if (resumeData.aiContent && typeof resumeData.aiContent === 'string') {
      try {
        console.log('📊 Parsing aiContent from JSON string');
        contentData = JSON.parse(resumeData.aiContent);
      } catch (e) {
        console.warn('⚠️  Failed to parse aiContent as JSON');
      }
    }
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          console.log('✅ [PDF Generator] PDF generation complete');
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);

        // Header - Name and Contact (try multiple possible field names)
        const name = contentData.name || contentData.title || resumeData.title || 'Professional Resume';
        doc.fontSize(24).font('Helvetica-Bold').text(name, { align: 'center' });
        doc.moveDown(0.5);
        
        // Contact info
        if (contentData.contact) {
          doc.fontSize(10).font('Helvetica');
          const contact = [
            contentData.contact.email,
            contentData.contact.phone,
            contentData.contact.location,
            contentData.contact.linkedin,
          ].filter(Boolean).join(' | ');
          if (contact) {
            doc.text(contact, { align: 'center' });
            doc.moveDown(1);
          }
        }

        // Check if resume has any actual content
        const hasContent = Boolean(
          contentData.summary || contentData.sections?.summary ||
          contentData.skills || contentData.sections?.skills ||
          contentData.experience || contentData.sections?.experience ||
          contentData.education || contentData.sections?.education
        );

        if (!hasContent) {
          doc.fontSize(12).font('Helvetica').text('This resume does not have any content yet.', { align: 'center' });
          doc.moveDown(0.5);
          doc.fontSize(10).text('Please edit the resume to add your professional information, skills, experience, and education.', { align: 'center' });
          doc.end();
          return;
        }

        // Professional Summary
        const summary = contentData.sections?.summary || contentData.summary;
        if (summary) {
          this.addSection(doc, 'PROFESSIONAL SUMMARY', summary);
        }

        // Skills - handle both array and object formats
        const skills = contentData.skills || contentData.sections?.skills;
        if (skills) {
          doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
          doc.moveDown(0.3);
          
          if (Array.isArray(skills)) {
            // Skills as array of strings or objects
            const skillNames = skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
            if (skillNames.length > 0) {
              doc.fontSize(10).font('Helvetica').text(skillNames.join(', '));
              doc.moveDown(0.5);
            }
          } else if (typeof skills === 'object') {
            // Skills as categorized object
            Object.entries(skills).forEach(([category, skillList]: [string, any]) => {
              if (Array.isArray(skillList) && skillList.length > 0) {
                doc.fontSize(10).font('Helvetica-Bold').text(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, { continued: true });
                doc.font('Helvetica').text(` ${skillList.join(', ')}`);
                doc.moveDown(0.2);
              }
            });
            doc.moveDown(0.5);
          }
        }

        // Education
        const education = contentData.sections?.education || contentData.education;
        if (education && Array.isArray(education) && education.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
          doc.moveDown(0.3);
          
          education.forEach((edu: any) => {
            const degree = edu.degree || edu.title || edu.name;
            const institution = edu.institution || edu.school || edu.university;
            if (degree) {
              doc.fontSize(11).font('Helvetica-Bold').text(degree);
            }
            if (institution) {
              doc.fontSize(10).font('Helvetica-Oblique').text(`${institution}${edu.location ? ', ' + edu.location : ''}`);
            }
            if (edu.graduationDate || edu.date || edu.year) {
              doc.fontSize(9).text(edu.graduationDate || edu.date || edu.year);
            }
            if (edu.gpa) {
              doc.text(`GPA: ${edu.gpa}`);
            }
            doc.moveDown(0.5);
          });
          doc.moveDown(0.5);
        }

        // Experience
        const experience = contentData.experience || contentData.sections?.experience;
        if (experience && Array.isArray(experience) && experience.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL EXPERIENCE');
          doc.moveDown(0.3);
          
          experience.forEach((exp: any) => {
            const title = exp.title || exp.position || exp.role;
            if (title) {
              doc.fontSize(11).font('Helvetica-Bold').text(title);
            }
            if (exp.company) {
              doc.fontSize(10).font('Helvetica-Oblique').text(`${exp.company}${exp.location ? ', ' + exp.location : ''}`);
            }
            const startDate = exp.startDate || exp.start || exp.from;
            const endDate = exp.endDate || exp.end || exp.to || 'Present';
            if (startDate || endDate !== 'Present') {
              doc.fontSize(9).font('Helvetica').text(`${startDate || ''} - ${endDate}`);
            }
            doc.moveDown(0.3);
            
            if (exp.achievements && Array.isArray(exp.achievements)) {
              exp.achievements.forEach((achievement: string) => {
                doc.fontSize(10).font('Helvetica').text(`• ${achievement}`, { indent: 10 });
              });
            } else if (exp.description) {
              doc.fontSize(10).font('Helvetica').text(`• ${exp.description}`, { indent: 10 });
            } else if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
              exp.responsibilities.forEach((resp: string) => {
                doc.fontSize(10).font('Helvetica').text(`• ${resp}`, { indent: 10 });
              });
            }
            doc.moveDown(0.5);
          });
          doc.moveDown(0.5);
        }

        // Projects
        if (contentData.sections?.projects && Array.isArray(contentData.sections.projects)) {
          doc.fontSize(14).font('Helvetica-Bold').text('PROJECTS');
          doc.moveDown(0.3);
          
          contentData.sections.projects.forEach((project: any) => {
            doc.fontSize(11).font('Helvetica-Bold').text(project.name || project.title);
            if (project.technologies) {
              doc.fontSize(9).font('Helvetica-Oblique').text(`Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}`);
            }
            if (project.description) {
              doc.fontSize(10).font('Helvetica').text(project.description, { indent: 10 });
            }
            if (project.achievements && Array.isArray(project.achievements)) {
              project.achievements.forEach((achievement: string) => {
                doc.fontSize(10).text(`• ${achievement}`, { indent: 10 });
              });
            }
            doc.moveDown(0.5);
          });
        }

        // Certifications
        if (contentData.sections?.certifications && Array.isArray(contentData.sections.certifications)) {
          doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICATIONS');
          doc.moveDown(0.3);
          
          contentData.sections.certifications.forEach((cert: any) => {
            doc.fontSize(10).font('Helvetica').text(`• ${cert.name || cert.title} - ${cert.issuer || cert.organization} (${cert.date || cert.year})`);
          });
          doc.moveDown(0.5);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addSection(doc: typeof PDFDocument, title: string, content: string | string[]) {
    doc.fontSize(14).font('Helvetica-Bold').text(title);
    doc.moveDown(0.3);
    
    if (Array.isArray(content)) {
      content.forEach((line) => {
        doc.fontSize(10).font('Helvetica').text(`• ${line}`, { indent: 10 });
      });
    } else {
      doc.fontSize(10).font('Helvetica').text(content, { align: 'justify' });
    }
    doc.moveDown(0.5);
  }

  //----------------------------------------------------
  // FILE UPLOAD + PARSING
  //----------------------------------------------------
  async uploadResume(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }
    const filePath = file.path;
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();

    let extractedText = '';

    if (ext === 'pdf') {
      const buf = await fs.readFile(filePath);
      const parsed = await pdfParse(buf);
      extractedText = parsed.text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (ext === 'txt') {
      extractedText = await fs.readFile(filePath, 'utf8');
    }

    const { data, error } = await this.supabase
      .getClient()
      .from('Resume')
      .insert({
        userid: userId,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        aicontent: { extractedText },
        skills: {},
        experience: {},
        sections: {},
      })
      .select('*')
      .single();

    if (error) this.handleError(error);
    return this.mapResume(data);
  }

  //----------------------------------------------------
  // SNAKE_CASE → CAMELCASE OUTPUT NORMALIZER
  //----------------------------------------------------
  private mapResume(r: any) {
    return {
      id: r.id,
      userId: r.userid,
      title: r.title,
      aiContent: r.aicontent,
      skills: r.skills,
      experience: r.experience,
      sections: r.sections,
      templateId: r.templateid,
      versionTag: r.versiontag,
      createdAt: r.createdat,
      updatedAt: r.updatedat,
    };
  }
}