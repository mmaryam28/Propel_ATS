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
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
let EducationController = class EducationController {
    educationService;
    constructor(educationService) {
        this.educationService = educationService;
    }
    create(dto) {
        return this.educationService.create(dto);
    }
    findAllByUser(userId) {
        return this.educationService.findAllByUser(Number(userId));
    }
    findOne(id) {
        return this.educationService.findOne(Number(id));
    }
    update(id, dto) {
        return this.educationService.update(Number(id), dto);
    }
    remove(id) {
        return this.educationService.remove(Number(id));
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateEducationDto]),
    __metadata("design:returntype", void 0)
], EducationController.prototype, "create", null);
__decorate([
    Get('user/:userId'),
    __param(0, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EducationController.prototype, "findAllByUser", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EducationController.prototype, "findOne", null);
__decorate([
    Put(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateEducationDto]),
    __metadata("design:returntype", void 0)
], EducationController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EducationController.prototype, "remove", null);
EducationController = __decorate([
    Controller('education'),
    __metadata("design:paramtypes", [EducationService])
], EducationController);
export { EducationController };
//# sourceMappingURL=education.controller.js.map