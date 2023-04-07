import { ChildEntity, ManyToOne } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { TradeItem } from "./TradeItem";

/**
 * A trade of a buyable slot.
 */
@ChildEntity()
export class BuyableSlotTrade extends TradeItem {
    /**
     * The buyable slot to trade.
     */
    @ManyToOne(type => BuyableSlot, buyableSlot => buyableSlot.trades, {eager: true})
    buyableSlot: BuyableSlot;
}