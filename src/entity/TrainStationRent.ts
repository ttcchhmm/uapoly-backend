import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Train station rent
 */
@Entity()
export class TrainStationRent {
    /**
     * The ID of the rent.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The rent for 1 station.
     */
    @Column()
    oneStation: number;

    /**
     * The rent for 2 stations.
     */
    @Column()
    twoStations: number;

    /**
     * The rent for 3 stations.
     */
    @Column()
    threeStations: number;

    /**
     * The rent for 4 stations.
     */
    @Column()
    fourStations: number;
}