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
let CertificationService = class CertificationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const payload = {
            user: { connect: { id: data.userId } },
            name: data.name,
            issuingOrganization: data.issuingOrganization,
            dateEarned: new Date(data.dateEarned),
            expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
            doesNotExpire: !!data.doesNotExpire,
            certificationNumber: data.certificationNumber,
            documentUrl: data.documentUrl,
            category: data.category,
            renewalReminderDays: data.renewalReminderDays,
        };
        return this.prisma.certification.create({ data: payload });
    }
    async findAllByUser(userId) {
        return this.prisma.certification.findMany({ where: { userId }, orderBy: { dateEarned: 'desc' } });
    }
    async findOne(id) {
        return this.prisma.certification.findUnique({ where: { id } });
    }
    async update(id, data) {
        const payload = { ...data };
        if (data.dateEarned)
            payload.dateEarned = new Date(data.dateEarned);
        if (data.expirationDate !== undefined)
            payload.expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;
        return this.prisma.certification.update({ where: { id }, data: payload });
    }
    async remove(id) {
        return this.prisma.certification.delete({ where: { id } });
    }
    async searchOrganizations(q) {
        return this.prisma.certification.findMany({
            where: { issuingOrganization: { contains: q, mode: 'insensitive' } },
            take: 10,
            distinct: ['issuingOrganization'],
        });
    }
};
CertificationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], CertificationService);
export { CertificationService };
//# sourceMappingURL=certification.service.js.map