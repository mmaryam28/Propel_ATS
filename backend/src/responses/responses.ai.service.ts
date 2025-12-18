import { Injectable } from '@nestjs/common';

interface AIFeedback {
  clarity_score: number; // 0-10
  star_method_score: number; // 0-10
  structure_score: number; // 0-10
  content_score: number; // 0-10
  overall_score: number; // 0-10
  strengths: string[];
  suggestions: string[];
  star_analysis: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  word_count: number;
  estimated_duration: number; // seconds (assuming ~150 words per minute)
}

interface PracticeFeedback {
  score: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    score_breakdown: {
      clarity: number;
      structure: number;
      content: number;
      delivery: number;
    };
  };
  comparison_to_original: string;
}

@Injectable()
export class ResponsesAIService {
  private ollamaUrl = 'http://localhost:11434';

  constructor() {
    console.log('Using Ollama AI at', this.ollamaUrl);
  }

  private async callOllama(prompt: string, maxTokens: number = 1500): Promise<any> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt + '\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown, no explanations, no code blocks.',
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: maxTokens,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let rawText = data.response || '';
      
      // Remove markdown code blocks if present
      rawText = rawText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Extract JSON object or array (get the outermost one)
      const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }
      
      // Only fix trailing commas - leave the rest as is since Ollama generates valid JSON
      const cleaned = rawText.replace(/,(\s*[}\]])/g, '$1');
      
      // Parse and return
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  async analyzeResponse(text: string, questionType: string): Promise<AIFeedback> {
    const prompt = `Analyze this ${questionType} interview response and provide detailed feedback:

Response: "${text}"

Provide your analysis in JSON format with:
1. clarity_score (0-10): How clear and understandable is the response?
2. star_method_score (0-10): How well does it follow the STAR method (Situation, Task, Action, Result)?
3. structure_score (0-10): How well-organized is the response?
4. content_score (0-10): How compelling and relevant is the content?
5. overall_score (0-10): Overall quality
6. strengths: Array of 2-3 specific strengths
7. suggestions: Array of 2-3 specific improvement suggestions
8. star_analysis: Object with boolean values for {situation, task, action, result} indicating if each component is present
9. Response in JSON format only, no additional text.`;

    try {
      const analysis = await this.callOllama(prompt, 1500);
      
      // Calculate word count and estimated duration
      const wordCount = text.trim().split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // 150 words per minute

      return {
        ...analysis,
        word_count: wordCount,
        estimated_duration: estimatedDuration,
      };
    } catch (error) {
      console.error('Error analyzing response:', error);
      
      // Return default analysis if API fails
      const wordCount = text.trim().split(/\s+/).length;
      return {
        clarity_score: 5,
        star_method_score: 5,
        structure_score: 5,
        content_score: 5,
        overall_score: 5,
        strengths: ['Response recorded'],
        suggestions: ['AI analysis temporarily unavailable'],
        star_analysis: {
          situation: false,
          task: false,
          action: false,
          result: false,
        },
        word_count: wordCount,
        estimated_duration: Math.ceil((wordCount / 150) * 60),
      };
    }
  }

  async providePracticeFeedback(
    originalResponse: string,
    practiceAttempt: string,
    questionType: string,
  ): Promise<PracticeFeedback> {
    const prompt = `Compare this practice attempt to the original prepared response for a ${questionType} interview question.

Original prepared response:
"${originalResponse}"

Practice attempt:
"${practiceAttempt}"

Provide feedback in JSON format with:
1. score (0-10): Overall quality of the practice attempt
2. feedback: {
   - strengths: Array of 2-3 things done well
   - improvements: Array of 2-3 areas to improve
   - score_breakdown: {clarity: 0-10, structure: 0-10, content: 0-10, delivery: 0-10}
}
3. comparison_to_original: Brief statement comparing practice to original

Response in JSON format only, no additional text.`;

    try {
      console.log('Calling Ollama for practice feedback...');
      const result = await this.callOllama(prompt, 1500);
      console.log('Practice feedback received:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error providing practice feedback:', error);
      console.error('Stack:', error.stack);
      
      return {
        score: 5,
        feedback: {
          strengths: ['Practice recorded'],
          improvements: ['AI feedback temporarily unavailable'],
          score_breakdown: {
            clarity: 5,
            structure: 5,
            content: 5,
            delivery: 5,
          },
        },
        comparison_to_original: 'Feedback temporarily unavailable',
      };
    }
  }

  async validateSTARMethod(response: string): Promise<{
    follows_star: boolean;
    missing_components: string[];
    suggestions: string[];
  }> {
    const prompt = `Analyze if this interview response follows the STAR (Situation, Task, Action, Result) method:

Response: "${response}"

Provide your analysis in JSON format with:
1. follows_star (boolean): Does it follow STAR method?
2. missing_components: Array of missing STAR components (empty if complete)
3. suggestions: Array of 2-3 suggestions to improve STAR structure

Response in JSON format only, no additional text.`;

    try {
      return await this.callOllama(prompt, 1200);
    } catch (error) {
      console.error('Error validating STAR method:', error);
      
      return {
        follows_star: false,
        missing_components: [],
        suggestions: ['AI validation temporarily unavailable'],
      };
    }
  }

  async suggestImprovements(
    response: string,
    context: { questionType: string; tags?: string[] },
  ): Promise<string[]> {
    const tagsContext = context.tags?.length ? `\nRelevant skills/context: ${context.tags.join(', ')}` : '';
    
    const prompt = `Suggest 3-5 specific improvements for this ${context.questionType} interview response:${tagsContext}

Response: "${response}"

Provide actionable suggestions as a JSON array of strings. Focus on:
- Making the response more compelling
- Adding specific metrics or results
- Improving structure and clarity
- Highlighting relevant skills/achievements

Response in JSON format only (array of strings), no additional text.`;

    try {
      return await this.callOllama(prompt, 800);
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return ['AI suggestions temporarily unavailable'];
    }
  }
}
