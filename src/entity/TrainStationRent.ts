import { Column, PrimaryGeneratedColumn } from "typeorm";

/**
 * Train station rent
 */
export class TrainStationRent {
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

    constructor(oneStation: number, twoStations: number, threeStations: number, fourStations: number) {
        this.oneStation = oneStation;
        this.twoStations = twoStations;
        this.threeStations = threeStations;
        this.fourStations = fourStations;
    }
}