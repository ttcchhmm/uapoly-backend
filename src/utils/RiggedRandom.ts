/**
 * A list of values to return when `RIGGED_RANDOM` is set to `true`.
 * The values are returned in the order they are defined.
 * When the end of the list is reached, the next value returned will be the first value in the list.
 * 
 * See https://xkcd.com/221/
 */
const VALUES = [
    1, 2, 5, 3, 6, 4, 2, 3, 5, 1, 6, 2, 4, 4, 2, 5, 3, 4, 1 
];

/**
 * The index of the next value to return from the VALUES array.
 */
let index = 0;

/**
 * Generate a random number between min and max.
 * If the environment variable `RIGGED_RANDOM` is set to `true`, the random number will be generated from a pre-defined list of values.
 * @param min The minimum value
 * @param max The maximum value
 * @returns A random number between min and max
 */
export function random(min: number, max: number) {
    if(process.env.RIGGED_RANDOM === 'true') {
        if(index >= VALUES.length) {
            index = 0;
        }
        return VALUES[index++];
    } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}