import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoardMaxPlayersFriendsOnly1681375884233 implements MigrationInterface {
    name = 'AddBoardMaxPlayersFriendsOnly1681375884233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" ADD "maxPlayers" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "board" ADD "friendsOnly" boolean NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "friendsOnly"`);
        await queryRunner.query(`ALTER TABLE "board" DROP COLUMN "maxPlayers"`);
    }

}
