import "reflect-metadata";
import { DataSource } from "typeorm";

import fs from "fs";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    username: process.env.DB_USER || "uapoly",
    password: process.env.DB_PASSWORD || "uapoly",
    database: process.env.DB_NAME || "uapoly",
    synchronize: false, // Never synchronise, even in development. Often breaks things.
    logging: process.env.ENV !== 'prod',
    entities: ["src/entity/*.{js,ts}"],
    migrations: ["src/migrations/*.{js,ts}"],
    subscribers: [],
    cache: getCacheConfig(),
});

/**
 * Get the cache config for TypeORM. Used as a workaround for a bug in TypeORM around non-Arch Linux systems.
 * @returns false if caching should be disabled, or a TypeORM cache config object.
 */
function getCacheConfig(): any {
    // Check for the existence of the pacman package manager, which is only available on Arch Linux.
    // If it exists, we can assume that we're running on an Arch Linux system, and can use Redis for caching.
    // This is not the best way (we should check /etc/os-release), but it's the easiest way to do it.
    const pacmanFound = fs.existsSync('/usr/bin/pacman');

    const force = parseInt(process.env.FORCE_CACHE || '0');

    if(pacmanFound) {
        console.log('Arch-based system detected. Using Redis for caching.');
    } else if(force) { // Display a warning
        console.log('WARNING: Force enabling database caching on known broken configuration.')
        console.log('WARNING: Database caching is known to be broken on non-Arch Linux systems.');
        console.log('WARNING: Set FORCE_CACHE=0 to disable caching.');
    }

    // Enable caching.
    if(pacmanFound || force) {
        return {
            type: "redis",
            options: {
                host: process.env.REDIS_HOST || "127.0.0.1",
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                password: process.env.REDIS_PASSWORD || "",
            },
            ignoreErrors: true,
        }
    } else { // Warn and disable caching.
        console.log('WARNING: Database caching is known to be broken on non-Arch Linux systems.');
        console.log('WARNING: Set FORCE_CACHE=1 to enable caching anyway.');
        return false;
    }
}