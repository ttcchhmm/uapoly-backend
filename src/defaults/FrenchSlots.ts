import { CardSlot } from "../entity/CardSlot";
import { FreeParkingSlot } from "../entity/FreeParkingSlot";
import { GoToJailSlot } from "../entity/GoToJailSlot";
import { PropertySlot } from "../entity/PropertySlot";
import { RestSlot } from "../entity/RestSlot";
import { TaxSlot } from "../entity/TaxSlot";
import { TrainStationSlot } from "../entity/TrainStationSlot";
import { UtilitySlot } from "../entity/UtilitySlot";
import { CardStyle } from "../enums/CardStyle";
import { Rents } from "./Rents";

/**
 * The current position of the slot.
 */
let position = 0;

/**
 * The default slots for the French version of the game.
 */
export const FrenchSlots = [
    new RestSlot("Départ", "Recevez votre salaire à chaque passage", "start", position++),
    new PropertySlot("Boulevard de Belleville", "Achetez cette propriété pour $60.", "brown", position++, 60, "brown", Rents.next().value),
    new CardSlot(CardStyle.COMMUNITY, position++),
    new PropertySlot("Rue Lecourbe", "Achetez cette propriété pour $60.", "brown", position++, 60, "brown", Rents.next().value),
    new TaxSlot(200, position++),
    new TrainStationSlot("Gare Montparnasse", "Achetez cette propriété pour $200.", "railroad", position++, 200, Rents.next().value),
    new PropertySlot("Rue de Vaugirard", "Achetez cette propriété pour $100.", "lightblue", position++, 100, "lightblue", Rents.next().value),
    new CardSlot(CardStyle.CHANCE, position++),
    new PropertySlot("Rue de Courcelles", "Achetez cette propriété pour $100.", "lightblue", position++, 100, "lightblue", Rents.next().value),
    new PropertySlot("Avenue de la République", "Achetez cette propriété pour $120.", "lightblue", position++, 120, "lightblue", Rents.next().value),
    new RestSlot("Prison", "Simple visite.", "jail", position++),
    new PropertySlot("Boulevard de la Villette", "Achetez cette propriété pour $140.", "pink", position++, 140, "pink", Rents.next().value),
    new UtilitySlot("Compagnie de Distribution de l'Électricité", "Achetez cette propriété pour $150.", "utility", position++, 150, Rents.next().value),
    new PropertySlot("Avenue de Neuilly", "Achetez cette propriété pour $140.", "pink", position++, 140, "pink", Rents.next().value),
    new PropertySlot("Rue de Paradis", "Achetez cette propriété pour $160.", "pink", position++, 160, "pink", Rents.next().value),
    new TrainStationSlot("Gare de Lyon", "Achetez cette propriété pour $200.", "railroad", position++, 200, Rents.next().value),
    new PropertySlot("Avenue Mozart", "Achetez cette propriété pour $180.", "orange", position++, 180, "orange", Rents.next().value),
    new CardSlot(CardStyle.COMMUNITY, position++),
    new PropertySlot("Boulevard Saint-Michel", "Achetez cette propriété pour $180.", "orange", position++, 180, "orange", Rents.next().value),
    new PropertySlot("Place Pigalle", "Achetez cette propriété pour $200.", "orange", position++, 200, "orange", Rents.next().value),
    new FreeParkingSlot(position++),
    new PropertySlot("Avenue Matignon", "Achetez cette propriété pour $220.", "red", position++, 220, "red", Rents.next().value),
    new CardSlot(CardStyle.CHANCE, position++),
    new PropertySlot("Boulevard Malesherbes", "Achetez cette propriété pour $220.", "red", position++, 220, "red", Rents.next().value),
    new PropertySlot("Avenue Henri-Martin", "Achetez cette propriété pour $240.", "red", position++, 240, "red", Rents.next().value),
    new TrainStationSlot("Gare du Nord", "Achetez cette propriété pour $200.", "railroad", position++, 200, Rents.next().value),
    new PropertySlot("Faubourg Saint-Honoré", "Achetez cette propriété pour $260.", "yellow", position++, 260, "yellow", Rents.next().value),
    new PropertySlot("Place de la Bourse", "Achetez cette propriété pour $260.", "yellow", position++, 260, "yellow", Rents.next().value),
    new UtilitySlot("Compagnie de Distribution des Eaux", "Achetez cette propriété pour $150.", "utility", position++, 150, Rents.next().value),
    new PropertySlot("Rue La Fayette", "Achetez cette propriété pour $280.", "yellow", position++, 280, "yellow", Rents.next().value),
    new GoToJailSlot(position++),
    new PropertySlot("Avenue de Breteuil", "Achetez cette propriété pour $300.", "green", position++, 300, "green", Rents.next().value),
    new PropertySlot("Avenue Foch", "Achetez cette propriété pour $300.", "green", position++, 300, "green", Rents.next().value),
    new CardSlot(CardStyle.COMMUNITY, position++),
    new PropertySlot("Boulevard des Capucines", "Achetez cette propriété pour $320.", "green", position++, 320, "green", Rents.next().value),
    new TrainStationSlot("Gare Saint-Lazare", "Achetez cette propriété pour $200.", "railroad", position++, 200, Rents.next().value),
    new CardSlot(CardStyle.CHANCE, position++),
    new PropertySlot("Avenue des Champs-Élysées", "Achetez cette propriété pour $350.", "darkblue", position++, 350, "darkblue", Rents.next().value),
    new TaxSlot(100, position++),
    new PropertySlot("Rue de la Paix", "Achetez cette propriété pour $400.", "darkblue", position++, 400, "darkblue", Rents.next().value),
];