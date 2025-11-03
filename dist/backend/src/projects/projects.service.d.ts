import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<any>;
    findAllByUser(userId: number): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, data: any): Promise<any>;
    remove(id: number): Promise<any>;
    addMedia(projectId: number, url: string, type?: string, caption?: string): Promise<any>;
}
