import { ChildEntity, Column } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot that makes the player pay taxes.
 */
@ChildEntity()
export class TaxSlot extends BoardSlot {
    /**
     * The amount of money the player has to pay.
     */
    @Column()
    amount: number;

    constructor(amount: number, position: number) {
        super("Tax", `Pay $${amount} in taxes.`, "tax", position);
        this.amount = amount;
    }

    getSimplified() {
        return {
            amount: this.amount,
            ...super.getSimplified(),
        };
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented.");
    }
}