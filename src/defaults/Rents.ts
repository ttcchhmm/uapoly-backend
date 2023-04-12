import { PropertyRent } from "../entity/PropertyRent";
import { TrainStationRent } from "../entity/TrainStationRent";
import { UtilityRent } from "../entity/UtilityRent";

/**
 * The rent of all properties, as an iterable.
 */
export const Rents = [
    new PropertyRent(2, 10, 30, 90, 160, 250),
    new PropertyRent(4, 20, 60, 180, 320, 450),
    new TrainStationRent(25, 50, 100, 200),
    new PropertyRent(6, 30, 90, 270, 400, 550),
    new PropertyRent(6, 30, 90, 270, 400, 550),
    new PropertyRent(8, 40, 100, 300, 450, 600),
    new PropertyRent(10, 50, 150, 450, 625, 750),
    new UtilityRent(4, 10),
    new PropertyRent(10, 50, 150, 450, 625, 750),
    new PropertyRent(12, 60, 180, 500, 700, 900),
    new TrainStationRent(25, 50, 100, 200),
    new PropertyRent(14, 70, 200, 550, 750, 950),
    new PropertyRent(14, 70, 200, 550, 750, 950),
    new PropertyRent(16, 80, 220, 600, 800, 1000),
    new PropertyRent(18, 90, 250, 700, 875, 1050),
    new PropertyRent(18, 90, 250, 700, 875, 1050),
    new PropertyRent(20, 100, 300, 750, 925, 1100),
    new TrainStationRent(25, 50, 100, 200),
    new PropertyRent(22, 110, 330, 800, 975, 1150),
    new PropertyRent(22, 110, 330, 800, 975, 1150),
    new UtilityRent(4, 10),
    new PropertyRent(24, 120, 360, 850, 1025, 1200),
    new PropertyRent(26, 130, 390, 900, 1100, 1275),
    new PropertyRent(26, 130, 390, 900, 1100, 1275),
    new PropertyRent(28, 150, 450, 1000, 1200, 1400),
    new TrainStationRent(25, 50, 100, 200),
    new PropertyRent(35, 175, 500, 1100, 1300, 1500),
    new PropertyRent(50, 200, 600, 1400, 1700, 2000),
][Symbol.iterator]();