import { AppDataSource } from "./data-source";
import express, { Express } from "express";
import * as bodyParser from "body-parser";
import dotenv from 'dotenv';

import { UserRouter } from "./routes/UserRouter";

dotenv.config();

AppDataSource.initialize().then(async () => {
    console.log('Database connection established');

    // Initialize the express app
    const app: Express = express();
    app.use(bodyParser.json());

    // Initialize the routes
    app.use('/user', UserRouter);

    // Start the server
    app.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
}).catch(error => console.log(error));
