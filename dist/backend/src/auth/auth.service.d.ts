import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private jwtService;
    private prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    register(firstname: string, lastname: string, email: string, password: string): Promise<string>;
    login(email: string, password: string): Promise<string>;
    generateToken(userId: string, email: string): string;
}
