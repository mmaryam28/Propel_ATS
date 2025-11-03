var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeOrmModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config) => {
                    const rawEnv = process.env.DEV_NO_DB;
                    const cfgVal = config.get('DEV_NO_DB');
                    console.log('[DEBUG] process.env.DEV_NO_DB=%s config.get("DEV_NO_DB")=%s', rawEnv, cfgVal);
                    const hasDbName = !!String(config.get('DB_NAME') ?? process.env.DB_NAME);
                    const noDb = !hasDbName && String(cfgVal ?? '') === '1';
                    if (noDb) {
                        console.log('💡 DEV_NO_DB=1 -> using in-memory SQLite');
                        return {
                            type: 'sqlite',
                            database: ':memory:',
                            autoLoadEntities: true,
                            synchronize: true,
                        };
                    }
                    const ssl = String(config.get('DB_SSL') ?? 'false') === 'true'
                        ? { rejectUnauthorized: false }
                        : false;
                    return {
                        type: 'postgres',
                        host: String(config.get('DB_HOST') ?? 'localhost'),
                        port: Number(config.get('DB_PORT') ?? 5432),
                        username: String(config.get('DB_USERNAME') ?? ''),
                        password: String(config.get('DB_PASSWORD') ?? ''),
                        database: String(config.get('DB_NAME') ?? ''),
                        ssl,
                        autoLoadEntities: true,
                        synchronize: true,
                    };
                },
            }),
            UsersModule,
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map