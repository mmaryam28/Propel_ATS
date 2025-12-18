import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuid } from 'uuid';

// Cost of Living indices (100 = baseline, e.g., national average)
const COL_INDICES: Record<string, number> = {
  'San Francisco, CA': 184,
  'New York, NY': 168,
  'Seattle, WA': 154,
  'Boston, MA': 148,
  'Los Angeles, CA': 145,
  'Washington, DC': 142,
  'Austin, TX': 119,
  'Denver, CO': 118,
  'Chicago, IL': 115,
  'Atlanta, GA': 107,
  'Phoenix, AZ': 105,
  'Dallas, TX': 104,
  'Houston, TX': 102,
  'Philadelphia, PA': 112,
  'Remote': 100, // Baseline
  'Default': 100,
};

@Injectable()
export class OffersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string, status?: string) {
    const client = this.supabase.getClient();
    
    let query = client
      .from('offers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    return data || [];
  }

  async findOne(userId: string, id: string) {
    const client = this.supabase.getClient();
    
    const { data, error } = await client
      .from('offers')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Offer not found');
    return data;
  }

  async create(userId: string, dto: any) {
    const client = this.supabase.getClient();

    // Validate required fields
    if (!dto.company || !dto.position || !dto.location) {
      throw new BadRequestException('Company, position, and location are required');
    }

    if (!dto.base_salary || parseFloat(dto.base_salary) <= 0) {
      throw new BadRequestException('Base salary must be greater than 0');
    }

    // Clean and normalize data
    const cleanedDto = this.cleanOfferData(dto);

    // Calculate all derived values
    const calculations = this.calculateOffer(cleanedDto);

    const offer = {
      id: uuid(),
      user_id: userId,
      ...cleanedDto,
      ...calculations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('offers')
      .insert(offer)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async update(userId: string, id: string, dto: any) {
    const client = this.supabase.getClient();

    // Verify ownership
    await this.findOne(userId, id);

    // Clean and normalize data
    const cleanedDto = this.cleanOfferData(dto);

    // Recalculate derived values
    const calculations = this.calculateOffer(cleanedDto);

    const { data, error } = await client
      .from('offers')
      .update({ ...cleanedDto, ...calculations, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async delete(userId: string, id: string) {
    const client = this.supabase.getClient();

    await this.findOne(userId, id);

    const { error } = await client
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Offer deleted' };
  }

  async recalculateOffer(userId: string, id: string) {
    const offer = await this.findOne(userId, id);
    const calculations = this.calculateOffer(offer);

    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('offers')
      .update(calculations)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // Clean and normalize offer data
  private cleanOfferData(dto: any) {
    return {
      company: dto.company?.trim(),
      position: dto.position?.trim(),
      location: dto.location?.trim(),
      remote_policy: dto.remote_policy || 'hybrid',
      
      // Convert empty strings to null or 0 for numeric fields
      base_salary: parseFloat(dto.base_salary) || 0,
      bonus: dto.bonus ? parseFloat(dto.bonus) : 0,
      signing_bonus: dto.signing_bonus ? parseFloat(dto.signing_bonus) : 0,
      equity_value: dto.equity_value ? parseFloat(dto.equity_value) : 0,
      equity_type: dto.equity_type || null,
      equity_vesting_years: dto.equity_vesting_years ? parseInt(dto.equity_vesting_years) : 4,
      
      health_insurance_value: dto.health_insurance_value ? parseFloat(dto.health_insurance_value) : 0,
      retirement_match_percent: dto.retirement_match_percent ? parseFloat(dto.retirement_match_percent) : 0,
      pto_days: dto.pto_days ? parseInt(dto.pto_days) : 0,
      other_benefits: dto.other_benefits || {},
      
      // Scores (default to 5 if not provided or invalid)
      culture_fit_score: this.validateScore(dto.culture_fit_score),
      growth_opportunities_score: this.validateScore(dto.growth_opportunities_score),
      work_life_balance_score: this.validateScore(dto.work_life_balance_score),
      team_quality_score: this.validateScore(dto.team_quality_score),
      mission_alignment_score: this.validateScore(dto.mission_alignment_score),
      
      status: dto.status || 'evaluating',
      offer_deadline: dto.offer_deadline || null,
      negotiation_notes: dto.negotiation_notes || null,
      pros: dto.pros || null,
      cons: dto.cons || null,
      notes: dto.notes || null,
      received_date: dto.received_date || null,
    };
  }

  private validateScore(score: any): number {
    const num = parseInt(score);
    if (isNaN(num) || num < 0 || num > 10) {
      return 5; // Default to 5
    }
    return num;
  }

  // Core calculation logic
  private calculateOffer(offer: any) {
    const baseSalary = parseFloat(offer.base_salary) || 0;
    const bonus = parseFloat(offer.bonus) || 0;
    const signingBonus = parseFloat(offer.signing_bonus) || 0;
    const equityValue = parseFloat(offer.equity_value) || 0;
    const vestingYears = parseInt(offer.equity_vesting_years) || 4;

    // Benefits calculations
    const healthInsurance = parseFloat(offer.health_insurance_value) || 0;
    const retirementMatchPercent = parseFloat(offer.retirement_match_percent) || 0;
    const retirementMatchValue = (baseSalary * retirementMatchPercent) / 100;
    
    const ptoDays = parseInt(offer.pto_days) || 0;
    const ptoValue = (baseSalary / 260) * ptoDays; // Assuming 260 work days/year

    // Other benefits from JSON
    const otherBenefits = offer.other_benefits || {};
    const otherBenefitsTotal = Object.values(otherBenefits).reduce(
      (sum: number, val: any) => sum + (parseFloat(val) || 0),
      0
    ) as number;

    // Annual equity value (vested per year)
    const annualEquity = equityValue / vestingYears;

    // Total compensation
    const totalCompensation =
      baseSalary +
      bonus +
      signingBonus / 4 + // Amortize signing bonus over 4 years
      annualEquity +
      healthInsurance +
      retirementMatchValue +
      ptoValue +
      otherBenefitsTotal;

    // Cost of living adjustment
    const colIndex = this.getCOLIndex(offer.location, offer.remote_policy);
    const colAdjustedSalary = (totalCompensation / colIndex) * 100;

    // Calculate weighted score
    const weightedScore = this.calculateWeightedScore(offer, totalCompensation);

    return {
      retirement_match_value: retirementMatchValue,
      pto_value: ptoValue,
      total_compensation: totalCompensation,
      col_index: colIndex,
      col_adjusted_salary: colAdjustedSalary,
      weighted_score: weightedScore,
    };
  }

  private getCOLIndex(location: string, remotePolicy: string): number {
    if (remotePolicy === 'fully_remote') {
      return COL_INDICES['Remote'];
    }

    // Try exact match
    if (COL_INDICES[location]) {
      return COL_INDICES[location];
    }

    // Try partial match (e.g., "San Francisco" matches "San Francisco, CA")
    const partialMatch = Object.keys(COL_INDICES).find(key =>
      key.toLowerCase().includes(location.toLowerCase())
    );

    if (partialMatch) {
      return COL_INDICES[partialMatch];
    }

    return COL_INDICES['Default'];
  }

  private calculateWeightedScore(offer: any, totalComp: number): number {
    // Normalize total comp to 0-10 scale (assuming $50k-$500k range)
    const minSalary = 50000;
    const maxSalary = 500000;
    const normalizedComp = Math.min(
      10,
      ((totalComp - minSalary) / (maxSalary - minSalary)) * 10
    );

    // Get non-financial scores
    const cultureFit = parseInt(offer.culture_fit_score) || 5;
    const growth = parseInt(offer.growth_opportunities_score) || 5;
    const workLife = parseInt(offer.work_life_balance_score) || 5;
    const teamQuality = parseInt(offer.team_quality_score) || 5;
    const mission = parseInt(offer.mission_alignment_score) || 5;

    // Weighted average (adjust weights as needed)
    const score =
      normalizedComp * 0.4 + // 40% compensation
      cultureFit * 0.15 + // 15% culture
      growth * 0.15 + // 15% growth
      workLife * 0.15 + // 15% work-life balance
      (teamQuality + mission) * 0.075; // 7.5% each for team and mission

    return Math.round(score * 100) / 100;
  }

  // Compare multiple offers
  async compareOffers(userId: string, offerIds: string[]) {
    const offers = await Promise.all(
      offerIds.map(id => this.findOne(userId, id))
    );

    // Calculate rankings
    const ranked = offers.map(offer => ({
      ...offer,
      rank_by_total_comp: 0,
      rank_by_col_adjusted: 0,
      rank_by_weighted_score: 0,
    }));

    // Rank by total compensation
    const byTotalComp = [...ranked].sort(
      (a, b) => b.total_compensation - a.total_compensation
    );
    byTotalComp.forEach((offer, index) => {
      const found = ranked.find(o => o.id === offer.id);
      if (found) found.rank_by_total_comp = index + 1;
    });

    // Rank by COL adjusted
    const byColAdjusted = [...ranked].sort(
      (a, b) => b.col_adjusted_salary - a.col_adjusted_salary
    );
    byColAdjusted.forEach((offer, index) => {
      const found = ranked.find(o => o.id === offer.id);
      if (found) found.rank_by_col_adjusted = index + 1;
    });

    // Rank by weighted score
    const byWeightedScore = [...ranked].sort(
      (a, b) => b.weighted_score - a.weighted_score
    );
    byWeightedScore.forEach((offer, index) => {
      const found = ranked.find(o => o.id === offer.id);
      if (found) found.rank_by_weighted_score = index + 1;
    });

    return {
      offers: ranked,
      bestOverall: byWeightedScore[0],
      highestComp: byTotalComp[0],
      bestValue: byColAdjusted[0],
    };
  }

  // Scenario analysis
  async analyzeScenario(userId: string, offerId: string, scenario: any) {
    const originalOffer = await this.findOne(userId, offerId);

    // Apply scenario changes
    const modifiedOffer = {
      ...originalOffer,
      ...scenario,
    };

    const newCalculations = this.calculateOffer(modifiedOffer);

    return {
      original: {
        total_compensation: originalOffer.total_compensation,
        col_adjusted_salary: originalOffer.col_adjusted_salary,
        weighted_score: originalOffer.weighted_score,
      },
      modified: {
        total_compensation: newCalculations.total_compensation,
        col_adjusted_salary: newCalculations.col_adjusted_salary,
        weighted_score: newCalculations.weighted_score,
      },
      difference: {
        total_compensation:
          newCalculations.total_compensation - originalOffer.total_compensation,
        col_adjusted_salary:
          newCalculations.col_adjusted_salary - originalOffer.col_adjusted_salary,
        weighted_score:
          newCalculations.weighted_score - originalOffer.weighted_score,
      },
      scenarioChanges: scenario,
    };
  }

  // Generate negotiation tips
  async generateNegotiationTips(userId: string, offerId: string) {
    const offer = await this.findOne(userId, offerId);
    const tips: Array<{ category: string; priority: string; tip: string }> = [];

    // Compare to user's other offers
    const allOffers = await this.findAll(userId);
    const avgSalary =
      allOffers.reduce((sum, o) => sum + o.base_salary, 0) / allOffers.length;

    if (offer.base_salary < avgSalary * 0.9) {
      tips.push({
        category: 'salary',
        priority: 'high',
        tip: `This base salary is ${Math.round(((avgSalary - offer.base_salary) / avgSalary) * 100)}% below your average offer. Consider negotiating for $${Math.round(avgSalary - offer.base_salary).toLocaleString()} more.`,
      });
    }

    if (offer.pto_days && offer.pto_days < 20) {
      tips.push({
        category: 'benefits',
        priority: 'medium',
        tip: `With ${offer.pto_days} PTO days, consider negotiating for additional time off. Industry standard is 20-25 days.`,
      });
    }

    if (offer.signing_bonus === 0 || !offer.signing_bonus) {
      tips.push({
        category: 'bonus',
        priority: 'medium',
        tip: 'No signing bonus offered. This is commonly negotiable, especially if you need to relocate or leave unvested equity.',
      });
    }

    if (offer.equity_value && offer.equity_value > 0) {
      tips.push({
        category: 'equity',
        priority: 'high',
        tip: 'Clarify equity details: vesting schedule, cliff period, strike price (for options), and post-termination exercise window.',
      });
    }

    if (!offer.remote_policy || offer.remote_policy === 'onsite') {
      tips.push({
        category: 'remote',
        priority: 'low',
        tip: 'Consider negotiating for remote work flexibility or hybrid arrangements.',
      });
    }

    return {
      offer_id: offerId,
      company: offer.company,
      tips,
      totalCompensation: offer.total_compensation,
      marketComparison: avgSalary,
    };
  }
}
