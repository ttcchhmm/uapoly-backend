import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Utility rent
 */
@Entity()
export class UtilityRent {
    /**
     * The ID of the rent.
     */
    @PrimaryGeneratedColumn()
    id: number;

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