import { Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance } from "typeorm";
import { TradeOffer } from "./TradeOffer";

/**
 * Represents a trade item.
 */
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export abstract class TradeItem {
    /**
     * The trade's ID.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The trade offer the item is requested in.
     */
    @ManyToOne(type => TradeOffer, tradeOffer => tradeOffer.requested, {eager: false})
    tradeOfferRequested: TradeOffer | null;

    /**
     * The trade offer the item is offered in.
     */
    @ManyToOne(type => TradeOffer, tradeOffer => tradeOffer.offered, {eager: false})
    tradeOfferOffered: TradeOffer | null;
}