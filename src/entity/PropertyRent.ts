import { Column, PrimaryGeneratedColumn } from "typeorm";

/**
 * Property rent
 */
export class PropertyRent {
    /**
     * The rent for 0 buildings.
     */
    @Column()
    noBuildings: number;

    /**
     * The rent for 1 building.
     */
    @Column()
    oneBuilding: number;

    /**
     * The rent for 2 buildings.
     */
    @Column()
    twoBuildings: number;

    /**
     * The rent for 3 buildings.
     */
    @Column()
    threeBuildings: number;

    /**
     * The rent for 4 buildings.
     */
    @Column()
    fourBuildings: number;
    
    /**
     * The rent for a hotel.
     */
    @Column()
    hotel: number;
}   