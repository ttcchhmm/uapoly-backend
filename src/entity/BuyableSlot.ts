import { Column, Entity, ManyToOne } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";
import { BuyableSlotState } from "../enums/BuyableSlotState";

/**
 * Represents a slot that can be bought by a player.
 */
@Entity()
export abstract class BuyableSlot extends BoardSlot {
    /**
     * The price of the slot.
     */
    @Column()
    price: number;

    /**
     * The player that owns the slot.
     */
    @ManyToOne(type => Player, player => player.ownedProperties, {eager: false})
    owner: Player | null;

    /**
     * The state of the slot.
     */
    @Column()
    state: BuyableSlotState;

    constructor(price: number) {
        super();
        this.price = price;
        this.owner = null;
    }

    /**
     * Make a player buy the slot.
     */
    buy(player: Player) {
        if(!this.owner) {
            this.owner = player;
            // TODO: Make the player pay the price.
        } else {
            throw new Error("The slot is already owned.");
        }
    }
}