var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { EducationModule } from './education/education.module';
import { CertificationModule } from './certification/certification.module';
import { ProjectsModule } from './projects/projects.module';
import { PrismaService } from './prisma/prisma.service';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            AuthModule,
            ApplicationsModule,
            EducationModule,
            CertificationModule,
            ProjectsModule,
        ],
        controllers: [AppController],
        providers: [AppService, PrismaService],
        exports: [AppService, PrismaService],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map