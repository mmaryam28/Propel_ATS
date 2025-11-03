import { PrismaService } from '../prisma/prisma.service';
export declare class ProfileController {
    private prisma;
    constructor(prisma: PrismaService);
    getProfileOverview(req: any): Promise<{
        message: string;
        summary?: undefined;
        recent?: undefined;
        completion?: undefined;
    } | {
        summary: {
            educationCount: any;
            certificationCount: any;
            projectCount: any;
        };
        recent: {
            education: any;
            certifications: any;
            projects: any;
        };
        completion: Promise<{
            score: number;
            sections: {
                education: any;
                certifications: any;
                projects: any;
                applications: any;
            };
        }>;
        message?: undefined;
    }>;
    private calculateProfileCompletion;
}
