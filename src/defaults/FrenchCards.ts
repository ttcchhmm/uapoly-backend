import { CardStyle } from "../entity/CardSlot";
import { CardDeck, ChanceActions, CommunityChestActions } from "./CardsActions";

/**
 * The default deck of cards for the French region.
 */
export const FrenchDeck: CardDeck = {
    [CardStyle.CHANCE]: [
        {
            description: 'Avancez jusqu\'à Rue de la Paix',
            action: ChanceActions[0],
        },

        {
            description: 'Avancez jusqu\'à la case Départ',
            action: ChanceActions[1],
        },

        {
            description: 'Avancez jusqu\'à l\'Avenue Henri-Martin',
            action: ChanceActions[2],
        },

        {
            description: 'Avancez jusqu\'au Boulevard de la Villette',
            action: ChanceActions[3],
        },

        {
            description: 'Avancez jusqu\'à la gare la plus proche',
            action: ChanceActions[4],
        },

        {
            description: 'Avancez jusqu\'à la Compagnie la plus proche',
            action: ChanceActions[5],
        },

        {
            description: 'La banque vous verse un dividende de $50',
            action: ChanceActions[6],
        },

        {
            description: 'Obtenez une carte "Sortez de prison"',
            action: ChanceActions[7],
        },

        {
            description: 'Reculez de trois cases',
            action: ChanceActions[8],
        },

        {
            description: 'Allez en prison',
            action: ChanceActions[9],
        },

        {
            description: 'Payez pour les réparations de voirie. $40 par maison. $115 par hôtel.',
            action: ChanceActions[10],
        },

        {
            description: 'Vous avez effectué un excès de vitesse. Payez une amende de $15 et perdez deux points sur votre permis.',
            action: ChanceActions[11],
        },

        {
            description: 'Allez à la Gare Montparnasse. Si vous passez par la case Départ, recevez $200',
            action: ChanceActions[12],
        },

        {
            description: 'Vous avez été élu Président du Conseil d\'Administration. Payez à chaque joueur $50',
            action: ChanceActions[13],
        },

        {
            description: 'Votre prêt vous rapporte $150',
            action: ChanceActions[14],
        },
    ],
    [CardStyle.COMMUNITY]: [
        {
            description: 'Avancez jusqu\'à la case Départ',
            action: CommunityChestActions[0],
        },

        {
            description: 'La banque a commis une erreur en votre faveur. Recevez $200',
            action: CommunityChestActions[1],
        },

        {
            description: 'Visite médicale. Payez $50',
            action: CommunityChestActions[2],
        },

        {
            description: 'La vente de vos actions vous rapporte $50',
            action: CommunityChestActions[3],
        },

        {
            description: 'Obtenez une carte "Sortez de prison"',
            action: CommunityChestActions[4],
        },

        {
            description: 'Allez en prison',
            action: CommunityChestActions[5],
        },

        {
            description: 'Votre placement vous rapporte $100',
            action: CommunityChestActions[6],
        },

        {
            description: 'Remboursement d\'impôt sur le revenu. Recevez $20',
            action: CommunityChestActions[7],
        },

        {
            description: 'Votre assurance-vie vous rapporte $100',
            action: CommunityChestActions[8],
        },

        {
            description: 'Vous allez aux urgences. Payez $100',
            action: CommunityChestActions[9],
        },

        {
            description: 'Vous payez votre école $150',
            action: CommunityChestActions[10],
        },

        {
            description: 'Recevez $25 pour votre travail en tant que consultant',
            action: CommunityChestActions[11],
        },

        {
            description: 'Payez pour les réparations de voirie. $40 par maison. $115 par hôtel.',
            action: CommunityChestActions[12],
        },

        {
            description: 'Vous avez obtenu la seconde place à un concours de beauté. Recevez $10',
            action: CommunityChestActions[13],
        },

        {
            description: 'Vous héritez de $100',
            action: CommunityChestActions[14],
        },
    ],
}