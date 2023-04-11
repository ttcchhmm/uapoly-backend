import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlotOrder1681219433373 implements MigrationInterface {
    name = 'AddSlotOrder1681219433373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" ADD "position" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" DROP COLUMN "position"`);
    }

}
