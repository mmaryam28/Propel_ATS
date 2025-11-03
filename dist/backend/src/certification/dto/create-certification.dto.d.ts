export declare class CreateCertificationDto {
    userId: number;
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
