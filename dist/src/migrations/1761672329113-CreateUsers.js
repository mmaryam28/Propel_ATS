export class CreateUsers1761672329113 {
    name = 'CreateUsers1761672329113';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isPendingDeletion"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletionRequestedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletionGraceEndsAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletionReason"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletionCancelToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletion_requested_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletion_grace_until" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletion_grace_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletion_requested_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletionCancelToken" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletionReason" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletionGraceEndsAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletionRequestedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isPendingDeletion" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordHash" character varying NOT NULL`);
    }
}
//# sourceMappingURL=1761672329113-CreateUsers.js.map