import { random } from "../utils/RiggedRandom";

/**
 * Roll the dices.
 * @param numberOfDices The number of dices to roll
 * @returns An array of the dices values
 */
export function rollDices(numberOfDices: number): number[] {
    const dices = [];
    for (let i = 0; i < numberOfDices; i++) {
        dices.push(random(1, 6));
    }

    return dices;
}