import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePKBoardSlot1681225312419 implements MigrationInterface {
    name = 'ChangePKBoardSlot1681225312419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_8b8964ded7ade2ff5027b2e8d81"`);
        await queryRunner.query(`ALTER TABLE "trade_item" RENAME COLUMN "buyableSlotName" TO "buyableSlotPosition"`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "PK_76a96f7171d2c93670d12b0780a"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "PK_85a50e59d3ef463b028432be48f" PRIMARY KEY ("boardId", "name", "position")`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "PK_85a50e59d3ef463b028432be48f"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "PK_e125587e4d9de9bb38dd45df041" PRIMARY KEY ("boardId", "position")`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP COLUMN "buyableSlotPosition"`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD "buyableSlotPosition" integer`);
        await queryRunner.query(`ALTER TABLE "trade_offer" DROP CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796"`);
        await queryRunner.query(`ALTER TABLE "trade_offer" ADD CONSTRAINT "UQ_8df1d81f1e9a6181ec70bd81ae5" UNIQUE ("messageId")`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796" FOREIGN KEY ("tradeOfferRequestedMessageId") REFERENCES "trade_offer"("messageId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_98a4a8a4f741eb4f69c494deb6a" FOREIGN KEY ("buyableSlotBoardId", "buyableSlotPosition") REFERENCES "board_slot"("boardId","position") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_offer" ADD CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade_offer" DROP CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_98a4a8a4f741eb4f69c494deb6a"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_7ecff00d538d09aad23b079134f"`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796"`);
        await queryRunner.query(`ALTER TABLE "trade_offer" DROP CONSTRAINT "UQ_8df1d81f1e9a6181ec70bd81ae5"`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_23dd2ef4d160dbdaa71092a1796" FOREIGN KEY ("tradeOfferRequestedMessageId") REFERENCES "trade_offer"("messageId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_offer" ADD CONSTRAINT "FK_8df1d81f1e9a6181ec70bd81ae5" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_item" DROP COLUMN "buyableSlotPosition"`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD "buyableSlotPosition" character varying`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "PK_e125587e4d9de9bb38dd45df041"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "PK_85a50e59d3ef463b028432be48f" PRIMARY KEY ("boardId", "name", "position")`);
        await queryRunner.query(`ALTER TABLE "board_slot" DROP CONSTRAINT "PK_85a50e59d3ef463b028432be48f"`);
        await queryRunner.query(`ALTER TABLE "board_slot" ADD CONSTRAINT "PK_76a96f7171d2c93670d12b0780a" PRIMARY KEY ("boardId", "name")`);
        await queryRunner.query(`ALTER TABLE "trade_item" RENAME COLUMN "buyableSlotPosition" TO "buyableSlotName"`);
        await queryRunner.query(`ALTER TABLE "trade_item" ADD CONSTRAINT "FK_8b8964ded7ade2ff5027b2e8d81" FOREIGN KEY ("buyableSlotBoardId", "buyableSlotName") REFERENCES "board_slot"("boardId","name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
