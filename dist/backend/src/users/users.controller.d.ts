import { UsersService } from './users.service';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    register(body: {
        email: string;
        password: string;
    }): Promise<{
        id: any;
        email: any;
        createdAt: any;
    }>;
    requestDeletion(id: string, dto: RequestAccountDeletionDto): Promise<{
        message: string;
        graceEndsAt?: undefined;
    } | {
        message: string;
        graceEndsAt: any;
    }>;
}
