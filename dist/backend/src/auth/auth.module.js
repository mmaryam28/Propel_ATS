var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            PrismaModule,
            ConfigModule.forRoot({
                isGlobal: true,
            }),
            JwtModule.registerAsync({
                imports: [ConfigModule],
                useFactory: async (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: 60 * 60 * 24 * 7,
                    },
                }),
                inject: [ConfigService],
            }),
        ],
        providers: [AuthService],
        controllers: [AuthController],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map