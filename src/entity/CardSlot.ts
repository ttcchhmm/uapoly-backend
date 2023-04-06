import { BoardSlot } from "./BoardSlot";
import { Player } from "./Player";
import { CardStyle } from "../enums/CardStyle";
import { Column, Entity } from "typeorm";

@Entity()
export class CardSlot extends BoardSlot {
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