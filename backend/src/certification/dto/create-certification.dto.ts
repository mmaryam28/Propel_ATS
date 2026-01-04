export class CreateCertificationDto {
  userId: string;
  name: string;
  issuingOrganization: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire?: boolean;
  certificationNumber?: string;
  documentUrl?: string;
  category?: string;
  renewalReminderDays?: number;
}
