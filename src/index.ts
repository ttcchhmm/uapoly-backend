import dotenv from 'dotenv';
dotenv.config();

import child_process from 'child_process';

if(process.env.ENV !== 'prod') {
    console.warn('WARNING: Running in development mode.');
    console.warn('WARNING: Using this mode in production CAN CAUSE DATA LOSS !!!');
    console.warn('WARNING: If this is a production environment, please set the ENV variable to "prod" in the .env file.');
    console.log('Continuing in 5 seconds...');
    child_process.execSync('sleep 5'); // Can't use setTimeout because it's async
}

import { AppDataSource } from "./data-source";
import express, { Express } from "express";
import * as bodyParser from "body-parser";

import { UserRouter } from "./routes/UserRouter";
import { FriendRouter } from './routes/FriendRouter';

AppDataSource.initialize().then(async () => {
    console.log('Database connection established');

    // Initialize the express app
    const app: Express = express();
    app.use(bodyParser.json());

    // Initialize the routes
    app.use('/user', UserRouter);
    app.use('/friend', FriendRouter);

    // Start the server
    app.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
}).catch(error => console.log(error));