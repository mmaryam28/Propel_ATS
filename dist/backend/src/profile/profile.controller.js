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
import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
let ProfileController = class ProfileController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfileOverview(req) {
        const userId = Number(req.query.userId) || null;
        if (!userId) {
            return { message: 'provide userId as query param for overview' };
        }
        const [education, certifications, projects] = await Promise.all([
            this.prisma.education.findMany({ where: { userId }, orderBy: { startDate: 'desc' }, take: 5 }),
            this.prisma.certification.findMany({ where: { userId }, orderBy: { dateEarned: 'desc' }, take: 5 }),
            this.prisma.project.findMany({ where: { userId }, orderBy: { startDate: 'desc' }, take: 6 }),
        ]);
        const completion = this.calculateProfileCompletion(userId);
        return {
            summary: {
                educationCount: await this.prisma.education.count({ where: { userId } }),
                certificationCount: await this.prisma.certification.count({ where: { userId } }),
                projectCount: await this.prisma.project.count({ where: { userId } }),
            },
            recent: { education, certifications, projects },
            completion,
        };
    }
    async calculateProfileCompletion(userId) {
        const totalSections = 4;
        const checks = [];
        const educCount = await this.prisma.education.count({ where: { userId } });
        checks.push(educCount > 0 ? 1 : 0);
        const certCount = await this.prisma.certification.count({ where: { userId } });
        checks.push(certCount > 0 ? 1 : 0);
        const projectCount = await this.prisma.project.count({ where: { userId } });
        checks.push(projectCount > 0 ? 1 : 0);
        const apps = await this.prisma.jobApplication.count({ where: { userId } });
        checks.push(apps > 0 ? 1 : 0);
        const score = Math.round((checks.reduce((a, b) => a + b, 0) / totalSections) * 100);
        return { score, sections: { education: educCount, certifications: certCount, projects: projectCount, applications: apps } };
    }
};
__decorate([
    Get('overview'),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getProfileOverview", null);
ProfileController = __decorate([
    Controller('profile'),
    __metadata("design:paramtypes", [PrismaService])
], ProfileController);
export { ProfileController };
//# sourceMappingURL=profile.controller.js.map