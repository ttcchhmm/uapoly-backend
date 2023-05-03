import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";

/**
 * Represents a slot where the player can rest.
 */
@ChildEntity()
export class RestSlot extends BoardSlot {}