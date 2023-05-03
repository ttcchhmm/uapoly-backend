import { ChildEntity, Column } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { UtilityRent } from "./UtilityRent";

@ChildEntity()
export class UtilitySlot extends BuyableSlot {
    /**
     * The rent of the property.
     */
    @Column(() => UtilityRent)
    utilityRent: UtilityRent;

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