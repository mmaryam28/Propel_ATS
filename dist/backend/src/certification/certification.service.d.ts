import { PrismaService } from '../prisma/prisma.service';
export declare class CertificationService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findAllByUser(userId: number): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, data: any): Promise<any>;
    remove(id: number): Promise<any>;
    searchOrganizations(q: string): Promise<any>;
}
