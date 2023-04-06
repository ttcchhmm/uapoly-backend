import { BuyableSlot } from "./BuyableSlot";
import { Player } from "./Player";
import { UtilityRent } from "./UtilityRent";

export class UtilitySlot extends BuyableSlot {
    rent: UtilityRent;

    onPlayerStop(player: Player): void {
        throw new Error("Method not implemented."); // TODO: Implement this method.
    }
}