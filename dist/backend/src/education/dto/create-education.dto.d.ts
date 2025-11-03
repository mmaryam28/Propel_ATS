export declare class CreateEducationDto {
    userId: number;
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    ongoing?: boolean;
    gpa?: number;
    showGpa?: boolean;
    honors?: string[];
    notes?: string;
}
