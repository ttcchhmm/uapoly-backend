import { ChildEntity, Column, ManyToOne, OneToMany } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";
import { BuyableSlotTrade } from "./BuyableSlotTrade";

/**
 * The state of a buyable slot.
 */
export const enum BuyableSlotState {
    /**
     * The slot is owned by a player.
     */
    OWNED = 'OWNED',

    /**
     * The slot is mortgaged.
     */
    MORTGAGED = 'MORTGAGED',

    /**
     * The slot is available to be bought.
     */
    AVAILABLE = 'AVAILABLE',
}

/**
 * Represents a slot that can be bought by a player.
 */
@ChildEntity()
export abstract class BuyableSlot extends BoardSlot {
    /**
     * The price of the slot.
     */
    @Column()
    price: number;

    /**
     * The player that owns the slot.
     */
    @ManyToOne(type => Player, player => player.ownedProperties, {eager: true})
    owner: Player | null;

    /**
     * The state of the slot.
     */
    @Column()
    state: BuyableSlotState;

    /**
     * The trades that are made for this slot.
     */
    @OneToMany(type => BuyableSlotTrade, buyableSlotTrade => buyableSlotTrade.buyableSlot)
    trades: Promise<BuyableSlotTrade[]>;

    constructor(name: string, description: string, iconStyle: string, position: number, price: number) {
        super(name, description, iconStyle, position);
        this.price = price;
        this.owner = null;
        this.state = BuyableSlotState.AVAILABLE;
    }

    override getSimplified() {
        return {
            price: this.price,
            owner: this.owner?.accountLogin,
            state: this.state,
            mortgageValue: this.getMortgageValue(),
            unmortgagePrice: this.getUnmortgagePrice(),
            ...super.getSimplified(),
        };
    }

    /**
     * Get the mortgage value of the slot.
     * @returns The mortgage value of the slot.
     */
    getMortgageValue() {
        return Math.ceil(this.price / 2);
    }

    /**
     * Get the price to unmortgage the slot.
     * @returns The price to unmortgage the slot.
     */
    getUnmortgagePrice() {
        return Math.ceil(this.price / 2 + this.price / 10);
    }
}