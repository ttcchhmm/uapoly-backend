import { ChildEntity, Column } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { UtilityRent } from "./UtilityRent";

@ChildEntity()
export class UtilitySlot extends BuyableSlot {
    /**
     * The rent of the property.
     */
    @Column(() => UtilityRent)
    utilityRent: UtilityRent;

    override onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }

    override getSimplified() {
        return {
            utilityRent: this.utilityRent,
            ...super.getSimplified(),
        };
    }

    constructor(name: string, description: string, iconStyle: string, position: number, price: number, utilityRent: UtilityRent) {
        super(name, description, iconStyle, position, price);
        this.utilityRent = utilityRent;
    }
}