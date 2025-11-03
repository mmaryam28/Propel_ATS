import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ReorderDto } from './dto/reorder.dto';
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
  // In-memory store: Map<userId, Skill[]>
  private store = new Map<string, Skill[]>();

  private normalizeName(name: string) {
    return name.trim().toLowerCase();
  }

  findAll(userId: string, search?: string): Skill[] {
    if (!userId) throw new BadRequestException('userId is required');
    const list = this.store.get(userId) ?? [];
    if (!search) return list.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
    const s = search.toLowerCase();
    return list
      .filter(item => item.name.toLowerCase().includes(s))
      .sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order);
  }

  create(dto: CreateSkillDto): Skill {
    const { userId, name, category, proficiency } = dto;
    if (!userId) throw new BadRequestException('userId is required');
    if (!name?.trim()) throw new BadRequestException('name is required');

    const list = this.store.get(userId) ?? [];
    const dup = list.find(s => this.normalizeName(s.name) === this.normalizeName(name));
    if (dup) throw new BadRequestException('Duplicate skill');

    const order = Math.max(0, ...list.filter(s => s.category === category).map(s => s.order)) + 1;
    const newSkill: Skill = {
      id: uuid(),
      userId,
      name: name.trim(),
      category,
      proficiency,
      order,
    };
    this.store.set(userId, [...list, newSkill]);
    return newSkill;
  }

  update(id: string, dto: UpdateSkillDto): Skill {
    const userId = dto.userId;
    if (!userId) throw new BadRequestException('userId is required');

    const list = this.store.get(userId) ?? [];
    const idx = list.findIndex(s => s.id === id);
    if (idx < 0) throw new NotFoundException('Skill not found');

    // Prevent duplicate on rename
    if (dto.name && this.normalizeName(dto.name) !== this.normalizeName(list[idx].name)) {
      const dup = list.find(s => this.normalizeName(s.name) === this.normalizeName(dto.name!));
      if (dup) throw new BadRequestException('Duplicate skill');
    }

    const updated: Skill = { ...list[idx], ...dto, name: dto.name?.trim() ?? list[idx].name };
    const newList = [...list];
    newList[idx] = updated;

    // If category changed, push to end of that category ordering
    if (dto.category && dto.category !== list[idx].category) {
      const maxOrder = Math.max(0, ...newList.filter(s => s.category === dto.category).map(s => s.order));
      updated.order = maxOrder + 1;
    }

    this.store.set(userId, newList);
    return updated;
  }

  remove(id: string) {
    // Find userId first
    for (const [uid, arr] of this.store.entries()) {
      const exists = arr.some(s => s.id === id);
      if (exists) {
        this.store.set(uid, arr.filter(s => s.id !== id));
        return { id };
      }
    }
    throw new NotFoundException('Skill not found');
  }

  reorder(dto: ReorderDto) {
    const { userId, category, orderedIds } = dto;
    if (!userId) throw new BadRequestException('userId is required');
    const list = this.store.get(userId) ?? [];
    const target = list.filter(s => s.category === category);

    if (target.length !== orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('orderedIds must include and only include skills within the category');
    }

    // Re-number orders according to orderedIds
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, i) => orderMap.set(id, i + 1));

    const updated = list.map(s => (s.category === category ? { ...s, order: orderMap.get(s.id)! } : s));
    this.store.set(userId, updated);
    return this.findAll(userId);
  }
}
