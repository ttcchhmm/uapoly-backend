/**
 * Array of default names for new games.
 */
const names = [
    // Generic names
    'My Game',
    'Fun Game',
    'Cool Game',
    'Chill Game',
    'Awesome Game',
    'Fun Required',

    // Fake movie names
    'UApoly: The Fun Begins',
    'UApoly 2: Electric Boogaloo',
    'UApoly 3: The Hotel Strikes Back',

    // Super Mario inspired names
    'Super UApoly 64',
    'UApoly Kart 8 Ultra Deluxe',
    'UApoly Party',

    // Zelda inspired names
    'The Legend of UApoly',
    'The Legend of UApoly: Breath of the Bank',
    'The Legend of UApoly: Tears of the Banker Adviser',

    // Game & Watch inspired names
    'Game & UApoly',

    // Sonic inspired names
    'UApoly Adventure',

    // Persona inspired names
    'UApoly 5 Royal',
    'UApoly 4 Golden',
    'UApoly 3 FES',

    // Shingeki no Kyojin inspired names
    'Attack on UApoly',
    'Attack on UApoly: The Final Season (Part ¾)',
];

/**
 * Gets a random name from the names array.
 * @returns A random name from the names array.
 */
export function getRandomName(): string {
    return names[Math.floor(Math.random() * names.length)];
}