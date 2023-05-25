import { ChildEntity, Column } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
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

    /**
     * The price for a building on the property.
     */
    @Column()
    buildingPrice: number;

    constructor(name: string, description: string, iconStyle: string, position: number, price: number, color: string, buildingPrice: number, propertyRent: PropertyRent) {
        super(name, description, iconStyle, position, price);
        this.color = color;
        this.propertyRent = propertyRent;
        this.buildingPrice = buildingPrice;
        this.numberOfBuildings = 0;
    }

    override getSimplified() {
        return {
            color: this.color,
            propertyRent: this.propertyRent,
            buildingPrice: this.buildingPrice,
            ...super.getSimplified(),
        };
    }
}