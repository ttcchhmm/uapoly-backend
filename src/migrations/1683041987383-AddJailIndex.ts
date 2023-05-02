import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJailIndex1683041987383 implements MigrationInterface {
    name = 'AddJailIndex1683041987383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "jailSlotIndex" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "jailSlotIndex"`);
    }

}
