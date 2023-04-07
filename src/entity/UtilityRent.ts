import { Column, PrimaryGeneratedColumn } from "typeorm";

/**
 * Utility rent
 */
export class UtilityRent {
    /**
     * The rent multiplier for 1 utility.
     */
    @Column()
    oneUtilityMultiplier: number;

    /**
     * The rent multiplier for 2 utilities.
     */
    @Column()
    twoUtilitiesMultiplier: number;
}