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
let EducationService = class EducationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const payload = {
            userId: data.userId,
            degree: data.degree,
            institution: data.institution,
            fieldOfStudy: data.fieldOfStudy,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            ongoing: !!data.ongoing,
            gpa: data.gpa ?? null,
            showGpa: data.showGpa ?? true,
            honors: data.honors ?? [],
            notes: data.notes,
        };
        return this.prisma.education.create({ data: payload });
    }
    async findAllByUser(userId) {
        return this.prisma.education.findMany({
            where: { userId },
            orderBy: [
                { endDate: 'desc' },
                { startDate: 'desc' },
            ],
        });
    }
    async findOne(id) {
        return this.prisma.education.findUnique({ where: { id } });
    }
    async update(id, dto) {
        const data = { ...dto };
        if (dto.startDate)
            data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined)
            data.endDate = dto.endDate ? new Date(dto.endDate) : null;
        return this.prisma.education.update({ where: { id }, data });
    }
    async remove(id) {
        return this.prisma.education.delete({ where: { id } });
    }
};
EducationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], EducationService);
export { EducationService };
//# sourceMappingURL=education.service.js.map