import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";

/**
 * Represents a slot where the player can rest.
 */
@ChildEntity()
export class RestSlot extends BoardSlot {
    onPlayerStop(player: Player) {} // Do nothing.
}