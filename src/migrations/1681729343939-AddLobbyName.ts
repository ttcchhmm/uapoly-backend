import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLobbyName1681729343939 implements MigrationInterface {
    name = 'AddLobbyName1681729343939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "name" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "name"`);
    }

}
