import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
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