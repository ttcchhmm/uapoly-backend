import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialDataStructures1680885398461 implements MigrationInterface {
    name = 'InitialDataStructures1680885398461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "friend" ("firstAccountLogin" character varying NOT NULL, "secondAccountLogin" character varying NOT NULL, "accepted" boolean NOT NULL, CONSTRAINT "PK_42c1f9778e630594f4a623d675b" PRIMARY KEY ("firstAccountLogin", "secondAccountLogin"))`);
        await queryRunner.query(`CREATE TABLE "board_slot" ("boardId" integer NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "iconStyle" character varying NOT NULL, "price" integer, "state" integer, "cardStyle" character varying, "color" character varying, "numberOfBuildings" integer, "amount" integer, "type" character varying NOT NULL, "ownerAccountLogin" character varying, "ownerBoardId" integer, "propertyRentNobuildings" integer, "propertyRentOnebuilding" integer, "propertyRentTwobuildings" integer, "propertyRentThreebuildings" integer, "propertyRentFourbuildings" integer, "propertyRentHotel" integer, "trainRentOnestation" integer, "trainRentTwostations" integer, "trainRentThreestations" integer, "trainRentFourstations" integer, "utilityRentOneutilitymultiplier" integer, "utilityRentTwoutilitiesmultiplier" integer, CONSTRAINT "PK_76a96f7171d2c93670d12b0780a" PRIMARY KEY ("boardId", "name"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6fd1fde90819a32017e4b4a1c3" ON "board_slot" ("type") `);
        await queryRunner.query(`CREATE TABLE "trade_item" ("id" SERIAL NOT NULL, "moneyAmount" integer, "outOfJailCardAmount" integer, "type" character varying NOT NULL, "tradeOfferRequestedMessageId" integer, "tradeOfferOfferedMessageId" integer, "buyableSlotBoardId" integer, "buyableSlotName" character varying, CONSTRAINT "PK_e5148c14d539b8d76b3cb1daf3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_354273eb7d16f17c63dd2fcdd0" ON "trade_item" ("type") `);
        await queryRunner.query(`CREATE TABLE "trade_offer" ("messageId" integer NOT NULL, CONSTRAINT "REL_8df1d81f1e9a6181ec70bd81ae" UNIQUE ("messageId"), CONSTRAINT "PK_8df1d81f1e9a6181ec70bd81ae5" PRIMARY KEY ("messageId"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" SERIAL NOT NULL, "content" text NOT NULL, "boardId" integer, "recipientAccountLogin" character varying, "recipientBoardId" integer, "senderAccountLogin" character varying, "senderBoardId" integer, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "board" ("id" integer NOT NULL, "jackpot" integer NOT NULL, "salary" integer NOT NULL, CONSTRAINT "PK_865a0f2e22c140d261b1df80eb1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "player" ("accountLogin" character varying NOT NULL, "boardId" integer NOT NULL, "money" integer NOT NULL, "iconStyle" integer NOT NULL, "outOfJailCards" integer NOT NULL, "currentSlotIndex" integer NOT NULL, "inJail" boolean NOT NULL, "isGameMaster" boolean NOT NULL, "gameId" integer, CONSTRAINT "PK_4ca200370ee32cded04110a6763" PRIMARY KEY ("accountLogin", "boardId"))`);
        await queryRunner.query(`CREATE TABLE "account" ("login" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "PK_02ec5e354b7a10ffa2e1c0b70e3" PRIMARY KEY ("login"))`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_e76430204b1c39ec5b8dc25fc83" FOREIGN KEY ("firstAccountLogin") REFERENCES "account"("login") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend" ADD CONSTRAINT "FK_9cfb5aff767f996ec1131ac17b7" FOREIGN KEY ("secondAccountLogin") REFERENCES "account"("login") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "FK_71309a2cdd90dd56870dac63fe9" FOREIGN KEY ("boardId") REFERENCES "board"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "FK_062585b0bd45f1cfe6df9c4e1b6" FOREIGN KEY ("ownerAccountLogin", "ownerBoardId") REFERENCES "player"("accountLogin","boardId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796" FOREIGN KEY ("tradeOfferRequestedMessageId") REFERENCES "trade_offer"("messageId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_7ecff00d538d09aad23b079134f" FOREIGN KEY ("tradeOfferOfferedMessageId") REFERENCES "trade_offer"("messageId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_8b8964ded7ade2ff5027b2e8d81" FOREIGN KEY ("buyableSlotBoardId", "buyableSlotName") REFERENCES "board_slot"("boardId","name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_offer" ADD CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_b3bf25790b2d89cf44cb3732b2c" FOREIGN KEY ("boardId") REFERENCES "board"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_4d1866364d9af1c205e38393909" FOREIGN KEY ("recipientAccountLogin", "recipientBoardId") REFERENCES "player"("accountLogin","boardId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_92d5acebccd25d958f70188a1e5" FOREIGN KEY ("senderAccountLogin", "senderBoardId") REFERENCES "player"("accountLogin","boardId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT "FK_42ddb41db5b22c48c14cc99e4ce" FOREIGN KEY ("accountLogin") REFERENCES "account"("login") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES "board"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a"`);
        await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT "FK_42ddb41db5b22c48c14cc99e4ce"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_92d5acebccd25d958f70188a1e5"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_4d1866364d9af1c205e38393909"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_b3bf25790b2d89cf44cb3732b2c"`);
        await queryRunner.query(`ALTER TABLE "trade_offer" DROP CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_8b8964ded7ade2ff5027b2e8d81"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_7ecff00d538d09aad23b079134f"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796"`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "FK_062585b0bd45f1cfe6df9c4e1b6"`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "FK_71309a2cdd90dd56870dac63fe9"`);
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_9cfb5aff767f996ec1131ac17b7"`);
        await queryRunner.query(`ALTER TABLE "friend" DROP CONSTRAINT "FK_e76430204b1c39ec5b8dc25fc83"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "player"`);
        await queryRunner.query(`DROP TABLE "board"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "trade_offer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_354273eb7d16f17c63dd2fcdd0"`);
        await queryRunner.query(`DROP TABLE "trade_item"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fd1fde90819a32017e4b4a1c3"`);
        await queryRunner.query(`DROP TABLE "board_slot"`);
        await queryRunner.query(`DROP TABLE "friend"`);
    }

}
