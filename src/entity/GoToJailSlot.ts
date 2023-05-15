import { ChildEntity } from "typeorm";
import { BoardSlot } from "./BoardSlot";

/**
 * Represents a slot that sends the player to jail.
 */
@ChildEntity()
export class GoToJailSlot extends BoardSlot {
    constructor(name: string, description: string, position: number) {
        super(name, description, "go-to-jail", position);
    }
}