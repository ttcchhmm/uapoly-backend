import { Column } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot that makes the player pay taxes.
 */
export class TaxSlot extends BoardSlot {
    /**
     * The amount of money the player has to pay.
     */
    @Column()
    amount: number;

    constructor(amount: number) {
        super();
        this.name = "Tax";
        this.description = `Pay $${amount} in taxes.`;
        this.iconStyle = "tax";

        this.amount = amount;
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented.");
    }
}