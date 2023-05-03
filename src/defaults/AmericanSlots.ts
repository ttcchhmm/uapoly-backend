import { CardSlot, CardStyle } from "../entity/CardSlot";
import { FreeParkingSlot } from "../entity/FreeParkingSlot";
import { GoToJailSlot } from "../entity/GoToJailSlot";
import { PropertySlot } from "../entity/PropertySlot";
import { RestSlot } from "../entity/RestSlot";
import { TaxSlot } from "../entity/TaxSlot";
import { TrainStationSlot } from "../entity/TrainStationSlot";
import { UtilitySlot } from "../entity/UtilitySlot";
import { getRents } from "./Rents";

/**
 * The default slots for the American version of the game.
 */
export function getAmericanSlots() {
    const rents = getRents();
    let position = 0;

    return [
        new RestSlot("Start", "Collect salary as you pass.", "start", position++),
        new PropertySlot("Mediterranean Avenue", "Buy this property for $60.", "brown", position++, 60, "brown", rents.next().value),
        new CardSlot(CardStyle.COMMUNITY, position++),
        new PropertySlot("Baltic Avenue", "Buy this property for $60.", "brown", position++, 60, "brown", rents.next().value),
        new TaxSlot(200, position++),
        new TrainStationSlot("Reading Railroad", "Buy this property for $200.", "railroad", position++, 200, rents.next().value),
        new PropertySlot("Oriental Avenue", "Buy this property for $100.", "lightblue", position++, 100, "lightblue", rents.next().value),
        new CardSlot(CardStyle.CHANCE, position++),
        new PropertySlot("Vermont Avenue", "Buy this property for $100.", "lightblue", position++, 100, "lightblue", rents.next().value),
        new PropertySlot("Connecticut Avenue", "Buy this property for $120.", "lightblue", position++, 120, "lightblue", rents.next().value),
        new RestSlot("Jail", "Just visiting.", "jail", position++),
        new PropertySlot("St. Charles Place", "Buy this property for $140.", "pink", position++, 140, "pink", rents.next().value),
        new UtilitySlot("Electric Company", "Buy this property for $150.", "utility", position++, 150, rents.next().value),
        new PropertySlot("States Avenue", "Buy this property for $140.", "pink", position++, 140, "pink", rents.next().value),
        new PropertySlot("Virginia Avenue", "Buy this property for $160.", "pink", position++, 160, "pink", rents.next().value),
        new TrainStationSlot("Pennsylvania Railroad", "Buy this property for $200.", "railroad", position++, 200, rents.next().value),
        new PropertySlot("St. James Place", "Buy this property for $180.", "orange", position++, 180, "orange", rents.next().value),
        new CardSlot(CardStyle.COMMUNITY, position++),
        new PropertySlot("Tennessee Avenue", "Buy this property for $180.", "orange", position++, 180, "orange", rents.next().value),
        new PropertySlot("New York Avenue", "Buy this property for $200.", "orange", position++, 200, "orange", rents.next().value),
        new FreeParkingSlot(position++),
        new PropertySlot("Kentucky Avenue", "Buy this property for $220.", "red", position++, 220, "red", rents.next().value),
        new CardSlot(CardStyle.CHANCE, position++),
        new PropertySlot("Indiana Avenue", "Buy this property for $220.", "red", position++, 220, "red", rents.next().value),
        new PropertySlot("Illinois Avenue", "Buy this property for $240.", "red", position++, 240, "red", rents.next().value),
        new TrainStationSlot("B. & O. Railroad", "Buy this property for $200.", "railroad", position++, 200, rents.next().value),
        new PropertySlot("Atlantic Avenue", "Buy this property for $260.", "yellow", position++, 260, "yellow", rents.next().value),
        new PropertySlot("Ventnor Avenue", "Buy this property for $260.", "yellow", position++, 260, "yellow", rents.next().value),
        new UtilitySlot("Water Works", "Buy this property for $150.", "utility", position++, 150, rents.next().value),
        new PropertySlot("Marvin Gardens", "Buy this property for $280.", "yellow", position++, 280, "yellow", rents.next().value),
        new GoToJailSlot(position++),
        new PropertySlot("Pacific Avenue", "Buy this property for $300.", "green", position++, 300, "green", rents.next().value),
        new PropertySlot("North Carolina Avenue", "Buy this property for $300.", "green", position++, 300, "green", rents.next().value),
        new CardSlot(CardStyle.COMMUNITY, position++),
        new PropertySlot("Pennsylvania Avenue", "Buy this property for $320.", "green", position++, 320, "green", rents.next().value),
        new TrainStationSlot("Short Line", "Buy this property for $200.", "railroad", position++, 200, rents.next().value),
        new CardSlot(CardStyle.CHANCE, position++),
        new PropertySlot("Park Place", "Buy this property for $350.", "darkblue", position++, 350, "darkblue", rents.next().value),
        new TaxSlot(100, position++),
        new PropertySlot("Boardwalk", "Buy this property for $400.", "darkblue", position++, 400, "darkblue", rents.next().value),
    ];
}