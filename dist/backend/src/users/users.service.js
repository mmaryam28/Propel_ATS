var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(arg1, arg2) {
        let email;
        let plainPassword;
        if (typeof arg1 === 'string' && typeof arg2 === 'string') {
            email = arg1.toLowerCase().trim();
            plainPassword = arg2;
        }
        else {
            email = arg1.email.toLowerCase().trim();
            plainPassword = arg1.password;
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            return { ok: false, message: 'Email already registered' };
        const hash = await bcrypt.hash(plainPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hash,
                profile: { create: {} },
            },
            include: { profile: true },
        });
        if (typeof arg1 === 'string' && typeof arg2 === 'string') {
            return user;
        }
        return {
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }
    async requestAccountDeletion(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return null;
        const now = new Date();
        const ends = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                isPendingDeletion: true,
                deletionRequestedAt: now,
                deletionGraceUntil: ends,
                deletionReason: dto.reason ?? null,
                deletionCancelToken: 'TEMP_TOKEN',
            },
        });
        return {
            message: 'Deletion scheduled',
            deletionGraceUntil: updated.deletionGraceUntil,
        };
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map