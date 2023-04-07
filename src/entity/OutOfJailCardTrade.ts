import { ChildEntity, Column } from "typeorm";
import { TradeItem } from "./TradeItem";

/**
 * A trade of out-of-jail cards.
 */
@ChildEntity()
export class OutOfJailCardTrade extends TradeItem {
    /**
     * The amount of out-of-jail cards to trade.
     */
    @Column()
    outOfJailCardAmount: number;
}