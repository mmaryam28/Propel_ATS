import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
export declare class UsersService {
    private readonly repo;
    private readonly profileRepo;
    constructor(repo: Repository<User>, profileRepo: Repository<Profile>);
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
    register(email: string, password: string): Promise<User>;
    requestAccountDeletion(userId: string, dto: RequestAccountDeletionDto): Promise<{
        message: string;
        deletionGraceUntil: Date;
    } | null>;
}
