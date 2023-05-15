import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";

/**
 * Represents the slot where players can win the jackpot.
 */
@ChildEntity()
export class FreeParkingSlot extends BoardSlot {
    constructor(name: string, description: string, position: number) {
        super(name, description, "free-parking", position);
    }
}