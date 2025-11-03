export declare class UpdateEducationDto {
    degree?: string;
    institution?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string | null;
    ongoing?: boolean;
    gpa?: number | null;
    showGpa?: boolean;
    honors?: string[];
    notes?: string;
}
