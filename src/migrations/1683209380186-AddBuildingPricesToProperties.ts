import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBuildingPricesToProperties1683209380186 implements MigrationInterface {
    name = 'AddBuildingPricesToProperties1683209380186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" ADD "buildingPrice" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board_slot" DROP COLUMN "buildingPrice"`);
    }

}
