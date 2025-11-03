import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
export declare class EducationController {
    private readonly educationService;
    constructor(educationService: EducationService);
    create(dto: CreateEducationDto): Promise<any>;
    findAllByUser(userId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateEducationDto): Promise<any>;
    remove(id: string): Promise<any>;
}
