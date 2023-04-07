import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { TradeItem } from "./TradeItem";
import { Message } from "./Message";

/**
 * Represents a trade offer.
 */
@Entity()
export class TradeOffer {
    /**
     * The ID of the trade offer.
     */
    @PrimaryColumn()
    messageId: number;

    /**
     * The message associated with the trade offer.
     */
    @OneToOne(type => Message, message => message.tradeOffer)
    @JoinColumn()
    message: Message;

    /**
     * The items requested in the trade offer.
     */
    @OneToMany(type => TradeItem, trade => trade.tradeOfferRequested, {eager: true})
    requested: TradeItem[];

    /**
     * The items offered in the trade offer.
     */
    @OneToMany(type => TradeItem, trade => trade.tradeOfferOffered, {eager: true})
    offered: TradeItem[];

    /**
     * Accepts the trade offer.
     */
    accept(): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}