import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(body: any): Promise<any>;
    findAllByUser(userId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<any>;
    addMedia(id: string, body: any): Promise<any>;
}
