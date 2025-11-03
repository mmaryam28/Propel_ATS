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
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '@nestjs/passport';
export class JwtAuthGuard extends AuthGuard('jwt') {
}
let ApplicationsController = class ApplicationsController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getAll(req) {
        return this.appService.findAll(req.user.userId);
    }
    create(req, data) {
        return this.appService.create(req.user.userId, data);
    }
    update(req, id, data) {
        return this.appService.update(req.user.userId, id, data);
    }
    delete(req, id) {
        return this.appService.remove(req.user.userId, id);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "getAll", null);
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
__decorate([
    Put(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "delete", null);
ApplicationsController = __decorate([
    Controller('applications'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [ApplicationsService])
], ApplicationsController);
export { ApplicationsController };
//# sourceMappingURL=applications.controller.js.map