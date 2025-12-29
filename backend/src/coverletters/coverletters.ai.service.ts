import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class CoverletterAIService {
  private openai: OpenAI;
  private readonly model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateCoverLetter({
    templateBody,
    jobDescription,
    profileSummary,
    tone,
    companyInfo,
    industry,
  }: {
    templateBody: string;
    jobDescription: string;
    profileSummary: string;
    tone: string;
    companyInfo?: string;
    industry?: string;
  }) {
    try {
      const prompt = `
        You are an expert career assistant writing for the ${industry} industry.
        Generate a ${tone} 3-paragraph cover letter tailored for the role described below.

        Industry: ${industry}
        Company: ${companyInfo ? companyInfo : "N/A"}
        Job Description: ${jobDescription}

        Use this template structure:
        ${templateBody}

        Guidelines:
        - Mention the company (${companyInfo ? companyInfo : "the organization"}) naturally.
        - Reflect the ${industry} field's language, tone, and priorities.
        - Keep it concise and professional (3 paragraphs).
        - Tailor the content to highlight skills and experience relevant to this specific job.
        - End with "Sincerely,\n\nKhalid Itani"
        Return only the completed cover letter text.
        `;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career assistant specializing in writing tailored, professional cover letters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      return content || 'Error: No content returned.';
    } catch (err) {
      console.error('OpenAI API Error:', err);
      return 'Error: Failed to generate AI content.';
    }
  }
}
