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
import { PrismaService } from '../prisma/prisma.service';
let ApplicationsService = class ApplicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(userId) {
        return this.prisma.jobApplication.findMany({
            where: { userId },
        });
    }
    async create(userId, data) {
        return this.prisma.jobApplication.create({
            data: {
                ...data,
                userId,
            },
        });
    }
    async update(userId, id, data) {
        return this.prisma.jobApplication.updateMany({
            where: { id, userId },
            data,
        });
    }
    async remove(userId, id) {
        return this.prisma.jobApplication.deleteMany({
            where: { id, userId },
        });
    }
};
ApplicationsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ApplicationsService);
export { ApplicationsService };
//# sourceMappingURL=applications.service.js.map