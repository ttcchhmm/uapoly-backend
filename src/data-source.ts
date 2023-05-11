import "reflect-metadata";
import { DataSource } from "typeorm";

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
    cache: {
        type: "ioredis",
        options: {
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
            password: process.env.REDIS_PASSWORD || "",
        },
        ignoreErrors: true,
    },
});