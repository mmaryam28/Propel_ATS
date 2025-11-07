import { Controller, Get, Post, Body, Req, Put, Param, Delete } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('employment')
export class EmploymentController {
  constructor(private supabase: SupabaseService) {}

  // Get all employment history for a user
  @Get(':userId')
  async getEmploymentHistory(@Param('userId') userId: string) {
    const client = this.supabase.getClient();
  const { data, error } = await client.from('employment').select('*').eq('user_id', userId).order('start_date', { ascending: false });
    if (error) return { error: error.message };
    return data;
  }

  // Add a new employment entry
  @Post()
  async addEmployment(@Body() body) {
    const client = this.supabase.getClient();
    const { userId, title, company, location, startDate, endDate, current, description } = body;
    const { data, error } = await client.from('employment').insert([
      {
        user_id: userId,
        title,
        company,
        location,
        start_date: startDate,
        end_date: endDate || null,
        current,
        description
      }
    ]);
    if (error) return { error: error.message };
    return data;
  }

  // Update an employment entry
  @Put(':id')
  async updateEmployment(@Param('id') id: number, @Body() body) {
    const client = this.supabase.getClient();
    const { title, company, location, startDate, endDate, current, description } = body;
    const { data, error } = await client.from('employment').update({
      title,
      company,
      location,
      start_date: startDate,
      end_date: endDate || null,
      current,
      description
    }).eq('id', id);
    if (error) return { error: error.message };
    return data;
  }

  // Delete an employment entry
  @Delete(':id')
  async deleteEmployment(@Param('id') id: number) {
    const client = this.supabase.getClient();
    const { error } = await client.from('employment').delete().eq('id', id);
    if (error) return { error: error.message };
    return { message: 'Deleted successfully' };
  }
}
