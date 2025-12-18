export class RecordOutcomeDto {
  job_id?: string;
  interview_date?: string;
  company?: string;
  position?: string;
  outcome: 'offer' | 'next_round' | 'rejected' | 'pending';
  interviewer_reaction?: 'positive' | 'neutral' | 'negative';
  notes?: string;
}
