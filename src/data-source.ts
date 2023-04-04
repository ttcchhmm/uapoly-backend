import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    username: process.env.DB_USER || "uapoly",
    password: process.env.DB_PASSWORD || "uapoly",
    database: process.env.DB_NAME || "uapoly",
    synchronize: process.env.ENV !== 'prod',
    logging: false,
    entities: ["src/entity/*.{js,ts}"],
    migrations: [],
    subscribers: [],
});