import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // GET /skills?userId=123&search=py
  @Get()
  findAll(@Query('userId') userId: string, @Query('search') search?: string) {
    return this.skillsService.findAll(userId, search);
  }

  // POST /skills
  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  // PATCH /skills/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  // DELETE /skills/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  // PATCH /skills/reorder
  @Patch('reorder/list')
  reorder(@Body() dto: ReorderDto) {
    return this.skillsService.reorder(dto);
  }
}
