import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoardPassword1681291405258 implements MigrationInterface {
    name = 'AddBoardPassword1681291405258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "password" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "password"`);
    }

}
