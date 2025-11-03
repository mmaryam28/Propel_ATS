import { PrismaService } from '../prisma/prisma.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
export declare class EducationService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateEducationDto): Promise<any>;
    findAllByUser(userId: number): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, dto: UpdateEducationDto): Promise<any>;
    remove(id: number): Promise<any>;
}
