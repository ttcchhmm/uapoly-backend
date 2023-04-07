import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Player } from "./Player";
import { BoardSlot } from "./BoardSlot";

@Entity()
export class Board {
    /**
     * The ID of the board.
     */
    @PrimaryColumn()
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
    @OneToMany(() => BoardSlot, slot => slot.board, {eager: true})
    slots: BoardSlot[];
}