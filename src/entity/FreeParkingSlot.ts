import { Entity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents the slot where players can win the jackpot.
 */
@Entity()
export class FreeParkingSlot extends BoardSlot {
    constructor() {
        super();
        this.name = "Free Parking";
        this.description = "The next player to land on this slot will win the jackpot.";
        this.iconStyle = "free-parking";
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented.");
    }
}