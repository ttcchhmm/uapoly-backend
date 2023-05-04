import { BoardSlot } from "../entity/BoardSlot";
import { AmericanDeck } from "./AmericanCards";
import { getAmericanSlots } from "./AmericanSlots";
import { CardDeck } from "./CardsActions";
import { FrenchDeck } from "./FrenchCards";
import { getFrenchSlots } from "./FrenchSlots";

/**
 * Represents a region of the board.
 */
export interface SlotRegion {
    /**
     * The name of the region.
     */
    name: string;

    /**
     * A function that returns the slots of the region.
     * @returns The slots of the region.
     */
    slots: () => BoardSlot[];

    /**
     * The position of the Jail slot.
     */
    jailPosition: number;

    /**
     * The deck of cards for the region.
     */
    deck: CardDeck;
}

/**
 * A map containing the default slots per region with the locale as key and the slots as value.
 */
export const Slots = new Map<string, SlotRegion>();

Slots.set('en-US', {
    name: 'United States Board',
    slots: getAmericanSlots,
    jailPosition: 10,
    deck: AmericanDeck,
});

Slots.set('fr-FR', {
    name: 'Plateau Français',
    slots: getFrenchSlots,
    jailPosition: 10,
    deck: FrenchDeck,
});