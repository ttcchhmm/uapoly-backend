import { AmericanSlots } from "./AmericanSlots";
import { FrenchSlots } from "./FrenchSlots";

/**
 * A map containing the default slots per region with the locale as key and the slots as value.
 */
export const Slots = {
    'en-US': {
        name: 'United States Board',
        slots: AmericanSlots,
    },
    'fr-FR': {
        name: 'Plateau Français',
        slots: FrenchSlots,
    }
};