import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocaleToBoard1683207323343 implements MigrationInterface {
    name = 'AddLocaleToBoard1683207323343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "locale" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "locale"`);
    }

}
