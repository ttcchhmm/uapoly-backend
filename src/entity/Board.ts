import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "./Player";
import { BoardSlot } from "./BoardSlot";
import { Message } from "./Message";

@Entity()
export class Board {
    /**
     * The ID of the board.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The players in the board.
     */
    @OneToMany(() => Player, player => player.game, {eager: true})
    players: Player[];

    /**
     * The current amount of money in the jackpot.
     */
    @Column()
    jackpot: number;

    /**
     * The amount of money players get when they pass the start slot.
     */
    @Column()
    salary: number;

    /**
     * The amount of money players get when they join the game.
     */
    @Column()
    initialMoney: number;

    /**
     * Whether the game has started or not.
     */
    @Column()
    started: boolean;

    /**
     * The index of the slot where the game starts.
     */
    @Column()
    startingSlotIndex: number;

    /**
     * The password of the game, null if it's a public game.
     */
    @Column({nullable: true, select: false})
    password: string | null;

    /**
     * The slots in the board.
     */
    @OneToMany(() => BoardSlot, slot => slot.board, {eager: true, cascade: true})
    slots: BoardSlot[];

    /**
     * The chat messages regarding the current game.
     */
    @OneToMany(() => Message, message => message.board, {eager: true})
    messages: Message[];
}