import { CertificationService } from './certification.service';
export declare class CertificationController {
    private readonly certService;
    constructor(certService: CertificationService);
    create(body: any): Promise<any>;
    findAllByUser(userId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<any>;
    searchOrgs(q: string): Promise<any>;
}
