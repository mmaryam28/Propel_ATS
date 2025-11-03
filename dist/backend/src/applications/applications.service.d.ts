import { PrismaService } from '../prisma/prisma.service';
export declare class ApplicationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): any;
    create(userId: string, data: any): Promise<any>;
    update(userId: string, id: string, data: any): Promise<any>;
    remove(userId: string, id: string): Promise<any>;
}
