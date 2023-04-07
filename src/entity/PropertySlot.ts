import { ChildEntity, Column, OneToOne } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { PropertyRent } from "./PropertyRent";

/**
 * Represents a property slot.
 */
@ChildEntity()
export class PropertySlot extends BuyableSlot {
    /**
     * The rent of the property.
     */
    @Column(() => PropertyRent)
    propertyRent: PropertyRent;

    /**
     * The color of the property.
     */
    @Column()
    color: string;

    /**
     * The number of buildings on the property.
     */
    @Column()
    numberOfBuildings: number;

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}