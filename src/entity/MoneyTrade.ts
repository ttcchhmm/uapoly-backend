import { ChildEntity, Column } from "typeorm";
import { TradeItem } from "./Trade";

/**
 * A trade of money.
 */
@ChildEntity()
export class MoneyTrade extends TradeItem {
    /**
     * The amount of money to trade.
     */
    @Column()
    moneyAmount: number;
}