import { PrismaService } from '../prisma/prisma.service';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(dto: {
        email: string;
        password: string;
    }): Promise<{
        ok: true;
        user: any;
    } | {
        ok: false;
        message: string;
    }>;
    register(email: string, password: string): Promise<any>;
    requestAccountDeletion(userId: string, dto: RequestAccountDeletionDto): Promise<{
        message: string;
        deletionGraceUntil: any;
    } | null>;
}
