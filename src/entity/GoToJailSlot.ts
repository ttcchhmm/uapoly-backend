import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot that sends the player to jail.
 */
@ChildEntity()
export class GoToJailSlot extends BoardSlot {
    constructor() {
        super();
        this.name = "Go to Jail";
        this.description = "Go directly to jail. Do not pass Go, do not collect $200.";
        this.iconStyle = "go-to-jail";
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented.");
    }
}