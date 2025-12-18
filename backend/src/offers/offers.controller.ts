import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(AuthGuard('jwt'))
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  async getAll(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user.userId;
    return this.offersService.findAll(userId, status);
  }

  @Get('compare')
  async compareOffers(@Req() req: any, @Query('ids') ids: string) {
    const userId = req.user.userId;
    const offerIds = ids.split(',');
    return this.offersService.compareOffers(userId, offerIds);
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.offersService.findOne(userId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() createOfferDto: any) {
    const userId = req.user.userId;
    return this.offersService.create(userId, createOfferDto);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateOfferDto: any) {
    const userId = req.user.userId;
    return this.offersService.update(userId, id, updateOfferDto);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.offersService.delete(userId, id);
  }

  @Post(':id/calculate')
  async recalculate(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.offersService.recalculateOffer(userId, id);
  }

  @Post(':id/scenario')
  async analyzeScenario(
    @Req() req: any,
    @Param('id') id: string,
    @Body() scenario: any
  ) {
    const userId = req.user.userId;
    return this.offersService.analyzeScenario(userId, id, scenario);
  }

  @Get(':id/negotiation-tips')
  async getNegotiationTips(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.offersService.generateNegotiationTips(userId, id);
  }
}
