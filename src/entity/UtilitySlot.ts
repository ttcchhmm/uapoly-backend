import { ChildEntity, Column, OneToOne } from "typeorm";
import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { UtilityRent } from "./UtilityRent";

@ChildEntity()
export class UtilitySlot extends BuyableSlot {
    @Column(() => UtilityRent)
    utilityRent: UtilityRent;

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}