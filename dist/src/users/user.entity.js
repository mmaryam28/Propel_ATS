var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToOne } from 'typeorm';
import { Profile } from './profile.entity';
let User = class User {
    id;
    email;
    password;
    createdAt;
    updatedAt;
    deletionRequestedAt;
    deletionGraceUntil;
    deletedAt;
    isPendingDeletion;
    deletionReason;
    deletionCancelToken;
    lowercaseEmail() {
        if (this.email)
            this.email = this.email.toLowerCase();
    }
    profile;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    Column({ name: 'deletion_requested_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletionRequestedAt", void 0);
__decorate([
    Column({ name: 'deletion_grace_until', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletionGraceUntil", void 0);
__decorate([
    Column({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletedAt", void 0);
__decorate([
    Column({ name: 'is_pending_deletion', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPendingDeletion", void 0);
__decorate([
    Column({ name: 'deletion_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletionReason", void 0);
__decorate([
    Column({ name: 'deletion_cancel_token', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletionCancelToken", void 0);
__decorate([
    BeforeInsert(),
    BeforeUpdate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "lowercaseEmail", null);
__decorate([
    OneToOne(() => Profile, (profile) => profile.user, { cascade: true, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "profile", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
//# sourceMappingURL=user.entity.js.map