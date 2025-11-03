export declare class UpdateCertificationDto {
    name?: string;
    issuingOrganization?: string;
    dateEarned?: string;
    expirationDate?: string | null;
    doesNotExpire?: boolean;
    certificationNumber?: string;
    documentUrl?: string;
    category?: string;
    renewalReminderDays?: number | null;
    verificationStatus?: string;
}
