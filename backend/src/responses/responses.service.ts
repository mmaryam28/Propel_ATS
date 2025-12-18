import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ResponsesAIService } from './responses.ai.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { RecordOutcomeDto } from './dto/record-outcome.dto';
import { AddTagsDto } from './dto/add-tags.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ResponsesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiService: ResponsesAIService,
  ) {}

  async findAll(
    userId: string,
    filters?: {
      question_type?: string;
      question_category?: string;
      is_favorite?: boolean;
      tags?: string[];
    },
  ) {
    const client = this.supabase.getClient();

    let query = client
      .from('interview_responses')
      .select(`
        *,
        response_tags(id, tag_type, tag_value)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (filters?.question_type) {
      query = query.eq('question_type', filters.question_type);
    }

    if (filters?.question_category) {
      query = query.eq('question_category', filters.question_category);
    }

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    let results = data || [];

    // Filter by tags if provided
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((response) =>
        filters.tags!.some((tag) =>
          response.response_tags?.some((rt: any) => rt.tag_value === tag),
        ),
      );
    }

    return results;
  }

  async findOne(userId: string, id: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('interview_responses')
      .select(`
        *,
        response_tags(id, tag_type, tag_value),
        response_versions(id, version_number, response_text, ai_feedback, word_count, estimated_duration, notes, created_at)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Response not found');
    return data;
  }

  async create(userId: string, dto: CreateResponseDto) {
    const client = this.supabase.getClient();

    console.log('=== CREATE RESPONSE DEBUG ===');
    console.log('User ID:', userId);
    console.log('DTO:', JSON.stringify(dto, null, 2));

    // Validate required fields
    if (!dto.question_text || !dto.current_response) {
      console.error('VALIDATION FAILED: Missing required fields');
      throw new BadRequestException('Question text and response are required');
    }

    let aiFeedback: any = null;
    try {
      // Get AI feedback on the response
      console.log('Calling AI service for analysis...');
      aiFeedback = await this.aiService.analyzeResponse(
        dto.current_response,
        dto.question_type,
      );
      console.log('AI feedback received:', aiFeedback);
    } catch (aiError: any) {
      console.error('AI Service Error (non-blocking):', aiError?.message || aiError);
      // Don't fail if AI service fails, just proceed without feedback
      aiFeedback = null;
    }

    const responseId = uuid();
    const versionId = uuid();

    // Create the response
    const response = {
      id: responseId,
      user_id: userId,
      question_text: dto.question_text,
      question_type: dto.question_type,
      question_category: dto.question_category || null,
      current_response: dto.current_response,
      current_version_id: versionId,
      is_favorite: dto.is_favorite || false,
      practice_count: 0,
      success_count: 0,
      total_uses: 0,
      success_rate: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Inserting response:', response);

    const { data: responseData, error: responseError } = await client
      .from('interview_responses')
      .insert(response)
      .select()
      .single();

    console.log('Insert result - Data:', responseData);
    console.log('Insert result - Error:', responseError);

    if (responseError) {
      console.error('DATABASE INSERT ERROR:', responseError);
      throw new BadRequestException(responseError.message);
    }

    // Create the first version
    const version = {
      id: versionId,
      response_id: responseId,
      user_id: userId,
      version_number: 1,
      response_text: dto.current_response,
      ai_feedback: aiFeedback,
      created_at: new Date().toISOString(),
    };

    console.log('Inserting version:', version);

    const { error: versionError } = await client
      .from('response_versions')
      .insert(version);

    if (versionError) throw new BadRequestException(versionError.message);

    // Add tags if provided
    if (dto.tags && dto.tags.length > 0) {
      const tags = dto.tags.map((tag) => ({
        id: uuid(),
        response_id: responseId,
        tag_type: tag.tag_type,
        tag_value: tag.tag_value,
        created_at: new Date().toISOString(),
      }));

      const { error: tagsError } = await client
        .from('response_tags')
        .insert(tags);

      if (tagsError) console.error('Error adding tags:', tagsError);
    }

    return this.findOne(userId, responseId);
  }

  async update(userId: string, id: string, dto: UpdateResponseDto) {
    const client = this.supabase.getClient();

    console.log('=== UPDATE RESPONSE DEBUG ===');
    console.log('User ID:', userId);
    console.log('Response ID:', id);
    console.log('Update DTO:', JSON.stringify(dto, null, 2));

    // Verify ownership
    const existing = await this.findOne(userId, id);

    // If response text changed, create new version
    let newVersionId = existing.current_version_id;
    if (dto.current_response && dto.current_response !== existing.current_response) {
      let aiFeedback: any = null;
      try {
        // Get AI feedback on new version
        aiFeedback = await this.aiService.analyzeResponse(
          dto.current_response,
          dto.question_type || existing.question_type,
        );
      } catch (aiError: any) {
        console.error('AI Service Error (non-blocking):', aiError?.message || aiError);
        aiFeedback = null;
      }

      // Get next version number
      const { data: versions } = await client
        .from('response_versions')
        .select('version_number')
        .eq('response_id', id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersionNumber = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      newVersionId = uuid();
      const version = {
        id: newVersionId,
        response_id: id,
        user_id: userId,
        version_number: nextVersionNumber,
        response_text: dto.current_response,
        ai_feedback: aiFeedback,
        created_at: new Date().toISOString(),
      };

      console.log('Creating new version:', version);

      const { error: versionError } = await client
        .from('response_versions')
        .insert(version);

      if (versionError) {
        console.error('Version insert error:', versionError);
        throw new BadRequestException(versionError.message);
      }
    }

    // Update the response (exclude fields that don't belong in interview_responses table)
    const { notes, tags, ...updateFields } = dto;
    
    const updates: any = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    if (dto.current_response) {
      updates.current_version_id = newVersionId;
    }

    console.log('Updating response with:', updates);

    const { data, error } = await client
      .from('interview_responses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    console.log('Update result - Data:', data);
    console.log('Update result - Error:', error);

    if (error) {
      console.error('UPDATE ERROR:', error);
      throw new BadRequestException(error.message);
    }

    return this.findOne(userId, id);
  }

  async delete(userId: string, id: string) {
    const client = this.supabase.getClient();

    await this.findOne(userId, id);

    const { error } = await client
      .from('interview_responses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);

    return { success: true, message: 'Response deleted' };
  }

  async getVersionHistory(userId: string, responseId: string) {
    const client = this.supabase.getClient();

    await this.findOne(userId, responseId);

    const { data, error } = await client
      .from('response_versions')
      .select('*')
      .eq('response_id', responseId)
      .order('version_number', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async restoreVersion(userId: string, responseId: string, versionId: string) {
    const client = this.supabase.getClient();

    await this.findOne(userId, responseId);

    // Get the version to restore
    const { data: version, error: versionError } = await client
      .from('response_versions')
      .select('*')
      .eq('id', versionId)
      .eq('response_id', responseId)
      .single();

    if (versionError || !version) throw new NotFoundException('Version not found');

    // Update the response to use this version
    const { data, error } = await client
      .from('interview_responses')
      .update({
        current_response: version.response_text,
        current_version_id: versionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async addTags(userId: string, responseId: string, dto: AddTagsDto) {
    const client = this.supabase.getClient();

    await this.findOne(userId, responseId);

    const tags = dto.tags.map((tag) => ({
      id: uuid(),
      response_id: responseId,
      tag_type: tag.tag_type,
      tag_value: tag.tag_value,
      created_at: new Date().toISOString(),
    }));

    const { error } = await client.from('response_tags').insert(tags);

    if (error) throw new BadRequestException(error.message);

    return this.findOne(userId, responseId);
  }

  async removeTags(userId: string, responseId: string, tagIds: string[]) {
    const client = this.supabase.getClient();

    await this.findOne(userId, responseId);

    const { error } = await client
      .from('response_tags')
      .delete()
      .in('id', tagIds)
      .eq('response_id', responseId);

    if (error) throw new BadRequestException(error.message);

    return this.findOne(userId, responseId);
  }

  async searchByTags(userId: string, tags: string[]) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('response_tags')
      .select(`
        response_id,
        interview_responses!inner(*)
      `)
      .in('tag_value', tags)
      .eq('interview_responses.user_id', userId);

    if (error) throw new BadRequestException(error.message);

    // Deduplicate responses
    const uniqueResponses = new Map();
    data?.forEach((item: any) => {
      if (!uniqueResponses.has(item.response_id)) {
        uniqueResponses.set(item.response_id, item.interview_responses);
      }
    });

    return Array.from(uniqueResponses.values());
  }

  async recordOutcome(userId: string, responseId: string, dto: RecordOutcomeDto) {
    const client = this.supabase.getClient();

    await this.findOne(userId, responseId);

    const outcome = {
      id: uuid(),
      response_id: responseId,
      user_id: userId,
      job_id: dto.job_id || null,
      interview_date: dto.interview_date || null,
      company: dto.company || null,
      position: dto.position || null,
      outcome: dto.outcome,
      interviewer_reaction: dto.interviewer_reaction || null,
      notes: dto.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('response_outcomes')
      .insert(outcome)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getSuccessMetrics(userId: string, responseId: string) {
    const client = this.supabase.getClient();

    const response = await this.findOne(userId, responseId);

    // Get all outcomes
    const { data: outcomes, error } = await client
      .from('response_outcomes')
      .select('*')
      .eq('response_id', responseId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    // Get practice sessions
    const { data: practices, error: practiceError } = await client
      .from('response_practice_sessions')
      .select('*')
      .eq('response_id', responseId)
      .order('created_at', { ascending: false });

    if (practiceError) throw new BadRequestException(practiceError.message);

    return {
      response_id: responseId,
      total_uses: response.total_uses || 0,
      success_count: response.success_count || 0,
      success_rate: response.success_rate || 0,
      practice_count: response.practice_count || 0,
      outcomes: outcomes || [],
      recent_practices: practices?.slice(0, 5) || [],
    };
  }

  async getPracticeSessions(userId: string, responseId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('response_practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('response_id', responseId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async createPracticeSession(
    userId: string,
    responseId: string,
    dto: PracticeSessionDto,
  ) {
    const client = this.supabase.getClient();

    console.log('Creating practice session with DTO:', JSON.stringify(dto, null, 2));

    if (!dto.practice_text) {
      throw new BadRequestException('practice_text is required');
    }

    const response = await this.findOne(userId, responseId);

    // Get AI feedback on practice attempt
    let feedback;
    try {
      feedback = await this.aiService.providePracticeFeedback(
        response.current_response,
        dto.practice_text,
        response.question_type,
      );
    } catch (error) {
      console.error('AI feedback failed, using fallback:', error.message);
      // Provide fallback feedback if AI fails
      feedback = {
        score: 5,
        feedback: {
          strengths: ['Practice session recorded'],
          improvements: ['AI feedback temporarily unavailable. Make sure Ollama is running with llama3.2 model'],
          score_breakdown: {
            clarity: 5,
            structure: 5,
            content: 5,
            delivery: 5,
          },
        },
        comparison_to_original: 'AI analysis unavailable - check Ollama service',
      };
    }

    const session = {
      id: uuid(),
      user_id: userId,
      response_id: responseId,
      practice_text: dto.practice_text,
      delivery_time: dto.delivery_time || null,
      ai_score: feedback.score,
      ai_feedback: feedback.feedback,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('response_practice_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Increment practice count
    await client
      .from('interview_responses')
      .update({
        practice_count: (response.practice_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .eq('user_id', userId);

    return {
      ...data,
      comparison_to_original: feedback.comparison_to_original,
    };
  }

  async suggestResponseForJob(userId: string, jobId: string, question?: string) {
    const client = this.supabase.getClient();

    // Get job details
    const { data: job, error: jobError } = await client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) throw new NotFoundException('Job not found');

    // Extract skills from job description (simple keyword extraction)
    const jobSkills = this.extractSkills(job.description || '');

    // Find responses with matching tags
    let query = client
      .from('interview_responses')
      .select(`
        *,
        response_tags(tag_value)
      `)
      .eq('user_id', userId)
      .order('success_rate', { ascending: false });

    const { data: responses, error } = await query;

    if (error) throw new BadRequestException(error.message);

    // Rank responses by relevance
    const rankedResponses = (responses || [])
      .map((response: any) => {
        const tags = response.response_tags?.map((t: any) => t.tag_value) || [];
        const matchCount = tags.filter((tag: string) =>
          jobSkills.some((skill) => skill.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(skill.toLowerCase())),
        ).length;

        return {
          ...response,
          relevance_score: matchCount,
        };
      })
      .filter((r: any) => r.relevance_score > 0)
      .sort((a: any, b: any) => {
        // Sort by relevance first, then success rate
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        return (b.success_rate || 0) - (a.success_rate || 0);
      })
      .slice(0, 5);

    return rankedResponses;
  }

  async identifyGaps(userId: string) {
    const client = this.supabase.getClient();

    // Get all user's responses
    const { data: responses, error } = await client
      .from('interview_responses')
      .select('question_type, question_category')
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);

    // Common question categories
    const commonCategories = [
      'leadership',
      'problem-solving',
      'conflict-resolution',
      'teamwork',
      'time-management',
      'communication',
      'adaptability',
      'technical-skills',
      'system-design',
      'debugging',
    ];

    const types = ['behavioral', 'technical', 'situational'];

    // Count responses by type and category
    const typeCount: any = {};
    const categoryCount: any = {};

    responses?.forEach((r: any) => {
      typeCount[r.question_type] = (typeCount[r.question_type] || 0) + 1;
      if (r.question_category) {
        categoryCount[r.question_category] = (categoryCount[r.question_category] || 0) + 1;
      }
    });

    // Identify gaps
    const missingTypes = types.filter((t) => !typeCount[t] || typeCount[t] === 0);
    const missingCategories = commonCategories.filter(
      (c) => !categoryCount[c] || categoryCount[c] === 0,
    );
    const underrepresentedCategories = commonCategories.filter(
      (c) => categoryCount[c] > 0 && categoryCount[c] < 2,
    );

    return {
      total_responses: responses?.length || 0,
      by_type: typeCount,
      by_category: categoryCount,
      gaps: {
        missing_types: missingTypes,
        missing_categories: missingCategories,
        underrepresented_categories: underrepresentedCategories,
      },
      suggestions: this.generateGapSuggestions(missingTypes, missingCategories),
    };
  }

  async exportPrepGuide(
    userId: string,
    filters?: { tags?: string[]; question_type?: string },
  ) {
    const responses = await this.findAll(userId, filters);

    // Group by question type
    const grouped: any = {};
    responses.forEach((response: any) => {
      if (!grouped[response.question_type]) {
        grouped[response.question_type] = [];
      }
      grouped[response.question_type].push(response);
    });

    return {
      title: 'Interview Preparation Guide',
      generated_at: new Date().toISOString(),
      total_responses: responses.length,
      responses_by_type: grouped,
    };
  }

  private extractSkills(text: string): string[] {
    // Simple keyword extraction - in production, use NLP
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node',
      'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'leadership',
      'agile', 'scrum', 'ci/cd', 'testing', 'communication',
    ];

    return commonSkills.filter((skill) =>
      text.toLowerCase().includes(skill),
    );
  }

  private generateGapSuggestions(
    missingTypes: string[],
    missingCategories: string[],
  ): string[] {
    const suggestions: string[] = [];

    if (missingTypes.length > 0) {
      suggestions.push(
        `Add ${missingTypes.join(', ')} question responses to your library`,
      );
    }

    if (missingCategories.length > 0) {
      suggestions.push(
        `Prepare responses for: ${missingCategories.slice(0, 3).join(', ')}`,
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('Your response library covers the main question types and categories!');
    }

    return suggestions;
  }
}
