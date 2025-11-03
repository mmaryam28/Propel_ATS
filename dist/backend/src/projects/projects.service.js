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
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const payload = {
            user: { connect: { id: data.userId } },
            name: data.name,
            description: data.description,
            role: data.role,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            technologies: data.technologies ?? [],
            url: data.url,
            teamSize: data.teamSize,
            outcomes: data.outcomes,
            industry: data.industry,
            status: data.status,
        };
        return this.prisma.project.create({ data: payload });
    }
    async findAllByUser(userId) {
        return this.prisma.project.findMany({ where: { userId }, orderBy: { startDate: 'desc' } });
    }
    async findOne(id) {
        return this.prisma.project.findUnique({ where: { id }, include: { media: true } });
    }
    async update(id, data) {
        const payload = { ...data };
        if (data.startDate)
            payload.startDate = new Date(data.startDate);
        if (data.endDate !== undefined)
            payload.endDate = data.endDate ? new Date(data.endDate) : null;
        return this.prisma.project.update({ where: { id }, data: payload });
    }
    async remove(id) {
        return this.prisma.project.delete({ where: { id } });
    }
    async addMedia(projectId, url, type = 'IMAGE', caption) {
        return this.prisma.projectMedia.create({ data: { project: { connect: { id: projectId } }, url, type, caption } });
    }
};
ProjectsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProjectsService);
export { ProjectsService };
//# sourceMappingURL=projects.service.js.map