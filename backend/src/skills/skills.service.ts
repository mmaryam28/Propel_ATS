import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ReorderDto } from './dto/reorder.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuid } from 'uuid';

export type SkillCategory = 'Technical' | 'Soft Skills' | 'Languages' | 'Industry-Specific';
export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  // For sorting within category:
  order: number;
}

@Injectable()
export class SkillsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private normalizeName(name: string) {
    return name.trim().toLowerCase();
  }

  async findAll(userId?: string, search?: string): Promise<Skill[]> {
    const supabase = this.supabaseService.getClient();
    
    let query = supabase
      .from('skills')
      .select('*');
    
    if (userId) {
      query = query.eq('"userId"', userId);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query.order('category').order('order');
    
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async create(dto: CreateSkillDto): Promise<Skill> {
    const { userId, name, category, proficiency } = dto;
    if (!userId) throw new BadRequestException('userId is required');
    if (!name?.trim()) throw new BadRequestException('name is required');

    const supabase = this.supabaseService.getClient();
    
    console.log('DEBUG: Creating skill:', { userId, name, category, proficiency });
    
    // Check for duplicate
    const { data: existing, error: checkError } = await supabase
      .from('skills')
      .select('id')
      .eq('"userId"', userId)
      .ilike('name', name.trim());
    
    console.log('DEBUG: Duplicate check:', { existing, checkError });
    
    if (existing && existing.length > 0) {
      throw new BadRequestException('Duplicate skill');
    }
    
    // Get max order for category
    const { data: categorySkills } = await supabase
      .from('skills')
      .select('order')
      .eq('"userId"', userId)
      .eq('category', category)
      .order('order', { ascending: false })
      .limit(1);
    
    const order = categorySkills && categorySkills.length > 0 ? categorySkills[0].order + 1 : 1;
    
    const newSkill: Skill = {
      id: uuid(),
      userId,
      name: name.trim(),
      category,
      proficiency,
      order,
    };
    
    console.log('DEBUG: Inserting skill:', newSkill);
    
    const { data, error } = await supabase
      .from('skills')
      .insert(newSkill)
      .select()
      .single();
    
    console.log('DEBUG: Insert result:', { data, error });
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    const userId = dto.userId;
    if (!userId) throw new BadRequestException('userId is required');

    const supabase = this.supabaseService.getClient();
    
    // Get existing skill
    const { data: existing, error: fetchError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .eq('"userId"', userId)
      .single();
    
    if (fetchError || !existing) throw new NotFoundException('Skill not found');

    // Prevent duplicate on rename
    if (dto.name && this.normalizeName(dto.name) !== this.normalizeName(existing.name)) {
      const { data: dup } = await supabase
        .from('skills')
        .select('id')
        .eq('"userId"', userId)
        .ilike('name', dto.name.trim())
        .neq('id', id);
      
      if (dup && dup.length > 0) throw new BadRequestException('Duplicate skill');
    }

    const updates: any = { ...dto };
    if (dto.name) updates.name = dto.name.trim();

    // If category changed, push to end of that category ordering
    if (dto.category && dto.category !== existing.category) {
      const { data: categorySkills } = await supabase
        .from('skills')
        .select('order')
        .eq('"userId"', userId)
        .eq('category', dto.category)
        .order('order', { ascending: false })
        .limit(1);
      
      updates.order = categorySkills && categorySkills.length > 0 ? categorySkills[0].order + 1 : 1;
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id)
      .eq('"userId"', userId)
      .select()
      .single();
    
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(id: string): Promise<{ id: string }> {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id);
    
    if (error) throw new NotFoundException('Skill not found');
    return { id };
  }

  async reorder(dto: ReorderDto): Promise<Skill[]> {
    const { userId, category, orderedIds } = dto;
    if (!userId) throw new BadRequestException('userId is required');
    
    const supabase = this.supabaseService.getClient();
    
    const { data: target } = await supabase
      .from('skills')
      .select('*')
      .eq('"userId"', userId)
      .eq('category', category);

    if (!target || target.length !== orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include and only include skills within the category');
    }

    // Update orders for each skill
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('skills')
        .update({ order: index + 1 })
        .eq('id', id)
        .eq('"userId"', userId)
    );
    
    await Promise.all(updates);
    return this.findAll(userId);
  }
}
