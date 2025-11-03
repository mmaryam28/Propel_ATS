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
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
let AuthService = class AuthService {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async register(firstname, lastname, email, password) {
        const hash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({ data: { firstname, lastname, email, password: hash } });
        return this.generateToken(user.id.toString(), user.email);
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new Error('Invalid credentials');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new Error('Invalid credentials');
        return this.generateToken(user.id.toString(), user.email);
    }
    generateToken(userId, email) {
        return this.jwtService.sign({ sub: userId, email });
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService, PrismaService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map