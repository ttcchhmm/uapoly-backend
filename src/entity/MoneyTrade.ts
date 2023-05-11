import { ChildEntity, Column } from "typeorm";
import { TradeItem } from "./TradeItem";

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

    constructor(moneyAmount: number) {
        super();
        this.moneyAmount = moneyAmount;
    }
}