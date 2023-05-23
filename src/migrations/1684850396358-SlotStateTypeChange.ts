import { MigrationInterface, QueryRunner } from "typeorm";

export class SlotStateTypeChange1684850396358 implements MigrationInterface {
    name = 'SlotStateTypeChange1684850396358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD "state" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD "state" integer`);
    }

}
