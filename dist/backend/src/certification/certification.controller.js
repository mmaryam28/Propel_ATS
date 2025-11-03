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
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CertificationService } from './certification.service';
let CertificationController = class CertificationController {
    certService;
    constructor(certService) {
        this.certService = certService;
    }
    create(body) {
        return this.certService.create(body);
    }
    findAllByUser(userId) {
        return this.certService.findAllByUser(Number(userId));
    }
    findOne(id) {
        return this.certService.findOne(Number(id));
    }
    update(id, body) {
        return this.certService.update(Number(id), body);
    }
    remove(id) {
        return this.certService.remove(Number(id));
    }
    searchOrgs(q) {
        return this.certService.searchOrganizations(q || '');
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "create", null);
__decorate([
    Get('user/:userId'),
    __param(0, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "findAllByUser", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "findOne", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "remove", null);
__decorate([
    Get('search/organizations'),
    __param(0, Query('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CertificationController.prototype, "searchOrgs", null);
CertificationController = __decorate([
    Controller('certifications'),
    __metadata("design:paramtypes", [CertificationService])
], CertificationController);
export { CertificationController };
//# sourceMappingURL=certification.controller.js.map