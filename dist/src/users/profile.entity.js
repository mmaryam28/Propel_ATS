var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
let Profile = class Profile {
    id;
    displayName;
    user;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Profile.prototype, "id", void 0);
__decorate([
    Column({ name: 'display_name', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Profile.prototype, "displayName", void 0);
__decorate([
    OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], Profile.prototype, "user", void 0);
Profile = __decorate([
    Entity('profiles')
], Profile);
export { Profile };
//# sourceMappingURL=profile.entity.js.map