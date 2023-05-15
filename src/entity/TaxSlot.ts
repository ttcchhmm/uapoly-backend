import { ChildEntity, Column } from "typeorm";
import { BoardSlot } from "./BoardSlot";

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

    constructor(name: string, description: string, amount: number, position: number) {
        super(name, description, "tax", position);
        this.amount = amount;
    }

    override getSimplified() {
        return {
            amount: this.amount,
            ...super.getSimplified(),
        };
    }
}