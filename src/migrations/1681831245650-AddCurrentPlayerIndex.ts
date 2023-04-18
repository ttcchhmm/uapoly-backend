import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrentPlayerIndex1681831245650 implements MigrationInterface {
    name = 'AddCurrentPlayerIndex1681831245650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "currentPlayerIndex" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "currentPlayerIndex"`);
    }

}
