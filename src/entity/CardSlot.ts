import { BoardSlot } from "./BoardSlot";
import { Column, ChildEntity } from "typeorm";

/**
 * The style of a card.
 */
export const enum CardStyle {
    /**
     * A "Community Chest" card.
     */
    COMMUNITY = "Community Chest",

    /**
     * A "Chance" card.
     */
    CHANCE = "Chance"
}

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

    override getSimplified() {
        return {
            cardStyle: this.cardStyle,
            ...super.getSimplified(),
        };
    }
}