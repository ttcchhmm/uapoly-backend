import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { TrainStationRent } from "./TrainStationRent";

/**
 * Represents a train station slot.
 */
export class TrainStationSlot extends BuyableSlot {
    /**
     * The rent of the property.
     */
    rent: TrainStationRent;

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}