import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents the slot where players can win the jackpot.
 */
@ChildEntity()
export class FreeParkingSlot extends BoardSlot {
    constructor(position: number) {
        super("Free Parking", "The next player to land on this slot will win the jackpot.", "free-parking", position);
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented.");
    }
}