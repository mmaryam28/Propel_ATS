import { Controller, Get, Post, Body, Req, Put, Param, Delete } from '@nestjs/common';
import { EmploymentService } from './employment.service';

@Controller('employment')
export class EmploymentController {
  constructor(private employmentService: EmploymentService) {}

  // Get all employment history for a user
  @Get(':userId')
  async getEmploymentHistory(@Param('userId') userId: string) {
    return this.employmentService.findAllByUser(userId);
  }

  // Add a new employment entry
  @Post()
  async addEmployment(@Body() body) {
    return this.employmentService.create(body);
  }

  // Update an employment entry
  @Put(':id')
  async updateEmployment(@Param('id') id: number, @Body() body) {
    return this.employmentService.update(id, body);
  }

  // Delete an employment entry
  @Delete(':id')
  async deleteEmployment(@Param('id') id: number) {
    return this.employmentService.delete(id);
  }
}
