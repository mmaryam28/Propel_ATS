import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class CoverletterAIService {
  private openai: OpenAI | null;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not found in environment variables - AI features will be disabled');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateCoverLetter({
    templateBody,
    jobDescription,
    profileSummary,
    tone,
    companyInfo,
  }: {
    templateBody: string;
    jobDescription: string;
    profileSummary: string;
    tone: string;
    companyInfo?: string;
  }) {
    try {
      const prompt = `
You are an expert career assistant. Using the following cover letter template, job description, and user profile,
generate a ${tone} professional cover letter with a clear opening, body paragraphs, and closing.

Template:
${templateBody}

Job Description:
${jobDescription}

User Profile:
${profileSummary}

${companyInfo ? `Company Research:\n${companyInfo}` : ''}
Incorporate the company’s mission, values, or recent achievements naturally into the letter.
Return only the completed cover letter text.
      `;

      if (!this.openai) {
        throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY to your environment variables.');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      console.log('OpenAI raw response:', response.choices?.[0]?.message);

      const result =
        response.choices?.[0]?.message?.content ||
        null;

      return result?.trim() || 'Error: No content returned from AI.';
    } catch (err) {
      console.error('OpenAI API Error:', err);
      return 'Error: Failed to generate AI content.';
    }
  }
}
