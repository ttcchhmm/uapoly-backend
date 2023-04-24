import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot where the player can rest.
 */
@ChildEntity()
export class RestSlot extends BoardSlot {
    override onPlayerStop(player: Player) {} // Do nothing.
}