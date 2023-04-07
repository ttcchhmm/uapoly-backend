import { ChildEntity, Column, OneToOne } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { TrainStationRent } from "./TrainStationRent";

/**
 * Represents a train station slot.
 */
@ChildEntity()
export class TrainStationSlot extends BuyableSlot {
    /**
     * The rent of the property.
     */
    @Column(() => TrainStationRent)
    trainRent: TrainStationRent;

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}