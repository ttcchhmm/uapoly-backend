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

    constructor(cardStyle: CardStyle, position: number) {
        super(cardStyle, "Draw a card.", "card", position);
        this.cardStyle = cardStyle;
    }

    // TODO: Implement this method.
    override onPlayerStop(player: Player) {
        throw new Error("Method not implemented.");
    }

    override getSimplified() {
        return {
            cardStyle: this.cardStyle,
            ...super.getSimplified(),
        };
    }
}