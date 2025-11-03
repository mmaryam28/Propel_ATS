var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Profile } from './profile.entity';
let UsersService = class UsersService {
    repo;
    profileRepo;
    constructor(repo, profileRepo) {
        this.repo = repo;
        this.profileRepo = profileRepo;
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
        const existing = await this.repo.findOne({ where: { email } });
        if (existing) {
            return { ok: false, message: 'Email already registered' };
        }
        const hash = await bcrypt.hash(plainPassword, 10);
        const user = this.repo.create({ email, password: hash });
        await this.repo.save(user);
        const profile = this.profileRepo.create({ displayName: null, user });
        await this.profileRepo.save(profile);
        user.profile = profile;
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
        const user = await this.repo.findOne({ where: { id: userId } });
        if (!user)
            return null;
        const now = new Date();
        const ends = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        user.isPendingDeletion = true;
        user.deletionRequestedAt = now;
        user.deletionGraceUntil = ends;
        user.deletionReason = dto.reason ?? null;
        user.deletionCancelToken = 'TEMP_TOKEN';
        await this.repo.save(user);
        return { message: 'Deletion scheduled', deletionGraceUntil: user.deletionGraceUntil };
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(Profile)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map