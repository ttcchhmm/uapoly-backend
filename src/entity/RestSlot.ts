import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot where the player can rest.
 */
@ChildEntity()
export class RestSlot extends BoardSlot {
    constructor() {
        super();
        this.name = "Rest";
        this.description = "Take a break.";
        this.iconStyle = "rest";
    }

    onPlayerStop(player: Player) {} // Do nothing.
}