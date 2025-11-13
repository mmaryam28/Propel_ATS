import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class CoverletterAIService {
  private readonly ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  private readonly model = process.env.OLLAMA_MODEL || 'phi3';

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
      // shorter, more focused prompt = faster token generation
      const prompt = `
        You are an expert career assistant writing for the ${industry} industry.
        Generate a ${tone} 3-paragraph cover letter tailored for the role described below.

        Industry: ${industry}
        Company: ${companyInfo ? companyInfo : "N/A"}
        Job Description: ${jobDescription}
        User Profile: ${profileSummary}

        Use this template structure:
        ${templateBody}

        Guidelines:
        - Mention the company (${companyInfo ? companyInfo : "the organization"}) naturally.
        - Reflect the ${industry} field's language, tone, and priorities.
        - Keep it concise and professional (under 3 paragraphs).
        Return only the completed cover letter text.
        `;


      const res = await fetch(this.ollamaUrl, {
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
        return 'Error: Failed to generate AI content.';
      }

      const data: any = await res.json();
      return (data.response || '').trim() || 'Error: No content returned.';
    } catch (err) {
      console.error('Ollama API Error:', err);
      return 'Error: Failed to generate AI content.';
    }
  }
}
