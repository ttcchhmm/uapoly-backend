import { ChildEntity, Column } from "typeorm";
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

    constructor(name: string, description: string, iconStyle: string, position: number, price: number, trainRent: TrainStationRent) {
        super(name, description, iconStyle, position, price);
        this.trainRent = trainRent;
    }

    getSimplified() {
        return {
            trainRent: this.trainRent,
            ...super.getSimplified(),
        };
    }

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}