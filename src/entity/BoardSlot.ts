import { Column, Entity, ManyToOne, PrimaryColumn, TableInheritance } from "typeorm";
import { Board } from "./Board";
import { Player } from "./Player";

/**
 * Represents a slot in a board.
 */
@Entity()
@TableInheritance({column: {type: "varchar", name: "type"}})
export abstract class BoardSlot {
    /**
     * The ID of the board the slot is in.
     */
    @PrimaryColumn()
    boardId: number;

    /**
     * The board the slot is in.
     */
    @ManyToOne(() => Board, board => board.slots, {eager: false})
    board: Board;

    /**
     * The name of the slot.
     */
    @PrimaryColumn()
    name: string;

    /**
     * The description of the slot.
     */
    @Column()
    description: string;

    /**
     * The style of the slot's icon.
     */
    @Column()
    iconStyle: string;
    
    /**
     * The position of the slot in the board.
     */
    @Column()
    position: number;

    constructor(name: string, description: string, iconStyle: string, position: number) {
        this.name = name;
        this.description = description;
        this.iconStyle = iconStyle;
        this.position = position;
    }

    /**
     * The action to perform when a player lands on the slot.
     * @param player The player that landed on the slot.
     */
    abstract onPlayerStop(player: Player): void;
}