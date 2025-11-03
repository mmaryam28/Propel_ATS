import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateUsers1761672329113 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
