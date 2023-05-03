/**
 * Roll the dices.
 * @param numberOfDices The number of dices to roll
 * @returns An array of the dices values
 */
export function rollDices(numberOfDices: number): number[] {
    const dices = [];
    for (let i = 0; i < numberOfDices; i++) {
        dices.push(Math.floor(Math.random() * 6) + 1);
    }

    return dices;
}