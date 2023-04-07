import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";
import { CardStyle } from "../enums/CardStyle";
import { Column, ChildEntity } from "typeorm";

/**
 * Represents a slot that draws a card.
 */
@ChildEntity()
export class CardSlot extends BoardSlot {
    /**
     * The style of the card.
     */
    @Column()
    cardStyle: CardStyle;

    constructor(cardStyle: CardStyle) {
        super();
        this.name = cardStyle;
        this.description = "Draw a card.";
        this.iconStyle = "card";

        this.cardStyle = cardStyle;
    }

    // TODO: Implement this method.
    onPlayerStop(player: Player) {
        throw new Error("Method not implemented.");
    }

}