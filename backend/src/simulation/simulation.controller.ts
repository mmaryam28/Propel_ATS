import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto, UpdateSimulationDto } from './dto/simulation.dto';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  /**
   * Create a new career path simulation
   * POST /simulation
   */
  @Post()
  async createSimulation(@Request() req, @Body() dto: CreateSimulationDto) {
    return this.simulationService.createSimulation(req.user.userId, dto);
  }

  /**
   * Get all simulations for the current user
   * GET /simulation
   */
  @Get()
  async listSimulations(@Request() req) {
    return this.simulationService.listSimulations(req.user.userId);
  }

  /**
   * Get a specific simulation
   * GET /simulation/:id
   */
  @Get(':id')
  async getSimulation(@Request() req, @Param('id') id: string) {
    return this.simulationService.getSimulation(req.user.userId, id);
  }

  /**
   * Update simulation preferences and re-run
   * PUT /simulation/:id
   */
  @Put(':id')
  async updateSimulation(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateSimulationDto
  ) {
    return this.simulationService.updateSimulation(req.user.userId, id, dto);
  }

  /**
   * Delete a simulation
   * DELETE /simulation/:id
   */
  @Delete(':id')
  async deleteSimulation(@Request() req, @Param('id') id: string) {
    await this.simulationService.deleteSimulation(req.user.userId, id);
    return { message: 'Simulation deleted successfully' };
  }

  /**
   * Get career role templates for an industry
   * GET /simulation/templates/:industry
   */
  @Get('templates/:industry')
  async getCareerTemplates(@Param('industry') industry: string) {
    return this.simulationService.getCareerTemplates(industry);
  }

  /**
   * Get all career role templates
   * GET /simulation/templates
   */
  @Get('templates')
  async getAllCareerTemplates() {
    return this.simulationService.getCareerTemplates();
  }
}
