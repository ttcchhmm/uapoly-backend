import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";
import { Board } from "./Board";
import { BuyableSlot } from "./BuyableSlot";
import { Message } from "./Message";

/**
 * Represents a player in the database.
 */
@Entity()
export class Player {
    /**
     * The login of the account representing the player.
     */
    @PrimaryColumn()
    accountLogin: string;

    /**
     * The ID of the board the player is in.
     */
    @PrimaryColumn()
    boardId: number;

    /**
     * The account representing the player.
     */
    @ManyToOne(() => Account, account => account.players, {eager: false})
    account: Account;

    /**
     * The board the player is in.
     */
    @ManyToOne(() => Board, board => board.players, {eager: false})
    game: Board;

    /**
     * The amount of money the player has.
     */
    @Column()
    money: number;

    /**
     * The style of the player's icon.
     */
    @Column()
    iconStyle: number;

    /**
     * The number of out-of-jail cards the player has.
     */
    @Column()
    outOfJailCards: number;

    /**
     * The index of the slot the player is currently on.
     */
    @Column()
    currentSlotIndex: number;

    /**
     * Whether the player is in jail.
     */
    @Column()
    inJail: boolean;

    /**
     * True if the player is a game master.
     */
    @Column()
    isGameMaster: boolean;

    /**
     * The properties owned by the player.
     */
    @OneToMany(() => BuyableSlot, property => property.owner, {eager: true})
    ownedProperties: BuyableSlot[];

    /**
     * The private messages the player has received.
     */
    @OneToMany(() => Message, message => message.recipient, {eager: false})
    privateMessagesReceived: Promise<Message[]>;

    /**
     * The messages the player has sent.
     */
    @OneToMany(() => Message, message => message.sender, {eager: false})
    messagesSent: Promise<Message[]>;
}