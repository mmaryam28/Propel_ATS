import { Profile } from './profile.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    deletionRequestedAt: Date | null;
    deletionGraceUntil: Date | null;
    deletedAt: Date | null;
    isPendingDeletion: boolean;
    deletionReason: string | null;
    deletionCancelToken: string | null;
    lowercaseEmail(): void;
    profile?: Profile | null;
}
