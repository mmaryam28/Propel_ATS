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
import { Body, Controller, Post, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async register(body) {
        const user = await this.usersService.register(body.email, body.password);
        return { id: user.id, email: user.email, createdAt: user.createdAt };
    }
    async requestDeletion(id, dto) {
        const result = await this.usersService.requestAccountDeletion(id, dto);
        if (!result) {
            return { message: 'User not found' };
        }
        return { message: 'Deletion scheduled', graceEndsAt: result.deletionGraceUntil };
    }
};
__decorate([
    Post('register'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    Post(':id/delete'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RequestAccountDeletionDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "requestDeletion", null);
UsersController = __decorate([
    Controller('users'),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
export { UsersController };
//# sourceMappingURL=users.controller.js.map