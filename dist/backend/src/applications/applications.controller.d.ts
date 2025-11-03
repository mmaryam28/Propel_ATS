import { ApplicationsService } from './applications.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
}
export declare class ApplicationsController {
    private appService;
    constructor(appService: ApplicationsService);
    getAll(req: any): any;
    create(req: any, data: any): Promise<any>;
    update(req: any, id: string, data: any): Promise<any>;
    delete(req: any, id: string): Promise<any>;
}
export {};
