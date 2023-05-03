import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";

/**
 * Represents a slot that sends the player to jail.
 */
@ChildEntity()
export class GoToJailSlot extends BoardSlot {
    constructor(position: number) {
        super("Go to Jail", "Go directly to jail. Do not pass Go, do not collect $200.", "go-to-jail", position);
    }
}