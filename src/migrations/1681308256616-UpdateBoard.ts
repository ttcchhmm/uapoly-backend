import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBoard1681308256616 implements MigrationInterface {
    name = 'UpdateBoard1681308256616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "initialMoney" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "board" ADD "started" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "board" ADD "startingSlotIndex" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "startingSlotIndex"`);
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "started"`);
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "initialMoney"`);
    }

}
