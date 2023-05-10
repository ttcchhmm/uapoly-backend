import { CardStyle } from "../entity/CardSlot";
import { CardDeck, ChanceActions, CommunityChestActions } from "./CardsActions";

/**
 * The default deck of cards for the American region.
 */
export const AmericanDeck: CardDeck = {
    [CardStyle.CHANCE]: [
        {
            description: 'Advance to Boardwalk',
            action: ChanceActions[0],
        },

        {
            description: 'Advance to Go',
            action: ChanceActions[1],
        },

        {
            description: 'Advance to Illinois Avenue',
            action: ChanceActions[2],
        },

        {
            description: 'Advance to St. Charles Place',
            action: ChanceActions[3],
        },

        {
            description: 'Advance to the nearest railroad',
            action: ChanceActions[4],
        },

        {
            description: 'Advance to the nearest utility',
            action: ChanceActions[5],
        },

        {
            description: 'Bank pays you dividend of $50',
            action: ChanceActions[6],
        },

        {
            description: 'Get out of jail free',
            action: ChanceActions[7],
        },

        {
            description: 'Go back 3 spaces',
            action: ChanceActions[8],
        },

        {
            description: 'Go directly to jail',
            action: ChanceActions[9],
        },

        {
            description: 'You are assessed for street repairs. $40 per house. $115 per hotel.',
            action: ChanceActions[10],
        },

        {
            description: 'Pay speeding fine of $15',
            action: ChanceActions[11],
        },

        {
            description: 'Take a trip to Reading Railroad',
            action: ChanceActions[12],
        },

        {
            description: 'You have been elected chairman of the board. Pay each player $50',
            action: ChanceActions[13],
        },

        {
            description: 'Your building loan matures. Collect $150',
            action: ChanceActions[14],
        },
    ],
    [CardStyle.COMMUNITY]: [
        {
            description: 'Advance to Go',
            action: CommunityChestActions[0],
        },

        {
            description: 'Bank error in your favor. Collect $200',
            action: CommunityChestActions[1],
        },

        {
            description: 'Doctor\'s fees. Pay $50',
            action: CommunityChestActions[2],
        },

        {
            description: 'From sale of stock you get $50',
            action: CommunityChestActions[3],
        },

        {
            description: 'Get out of jail free',
            action: CommunityChestActions[4],
        },

        {
            description: 'Go to jail',
            action: CommunityChestActions[5],
        },

        {
            description: 'Holiday fund matures. Collect $100',
            action: CommunityChestActions[6],
        },

        {
            description: 'Income tax refund. Collect $20',
            action: CommunityChestActions[7],
        },

        {
            description: 'Life insurance matures. Collect $100',
            action: CommunityChestActions[8],
        },

        {
            description: 'Pay hospital fees of $100',
            action: CommunityChestActions[9],
        },

        {
            description: 'Pay school fees of $50',
            action: CommunityChestActions[10],
        },

        {
            description: 'Receive $25 consultancy fee',
            action: CommunityChestActions[11],
        },

        {
            description: 'You are assessed for street repairs. $40 per house. $115 per hotel.',
            action: CommunityChestActions[12],
        },

        {
            description: 'You have won second prize in a beauty contest. Collect $10',
            action: CommunityChestActions[13],
        },

        {
            description: 'You inherit $100',
            action: CommunityChestActions[14],
        },
    ],
}