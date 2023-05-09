import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "./Player";
import { TradeOffer } from "./TradeOffer";
import { Board } from "./Board";

/**
 * Represents a message in the chat.
 */
@Entity()
export class Message {
    /**
     * The ID of the message.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The game the message is in.
     */
    @ManyToOne(type => Board, board => board.messages, {eager: false})
    board: Board;

    /**
     * The content of the message.
     */
    @Column({type: "text"})
    content: string;

    /**
     * The player the message is destined for. Can be null if the message is a global message.
     */
    @ManyToOne(type => Player, player => player.privateMessagesReceived, {eager: true})
    recipient: Player | null;

    /**
     * The player that sent the message.
     */
    @ManyToOne(type => Player, player => player.messagesSent, {eager: true})
    sender: Player;

    /**
     * The trade offer the message is about. Can be null if the message is not about a trade offer.
     */
    @OneToOne(type => TradeOffer, tradeOffer => tradeOffer.message, {eager: true})
    tradeOffer: TradeOffer | null;

    constructor(board: Board, content: string, sender: Player, recipient: Player | null = null, tradeOffer: TradeOffer | null = null) {
        this.board = board;
        this.content = content;
        this.sender = sender;
        this.recipient = recipient;
        this.tradeOffer = tradeOffer;
    }
}