import dotenv from 'dotenv';
dotenv.config();

import child_process from 'child_process';

if(process.env.ENV !== 'prod') {
    console.warn('WARNING: Running in development mode.');
    console.warn('WARNING: Using this mode in production CAN CAUSE DATA LOSS !!!');
    console.warn('WARNING: CORS will be disabled. (This is a security risk).')
    console.warn('WARNING: If this is a production environment, please set the ENV variable to "prod" in the .env file.');
    console.log('Continuing in 5 seconds...');
    child_process.execSync('sleep 5'); // Can't use setTimeout because it's async
}

import { AppDataSource } from "./data-source";
import express, { Express } from "express";
import * as bodyParser from "body-parser";

import { UserRouter } from "./routes/UserRouter";
import { FriendRouter } from './routes/FriendRouter';
import { HTTPError } from './utils/HTTPError';

AppDataSource.initialize().then(async () => {
    console.log('Database connection established');

    // Initialize the express app
    const app: Express = express();
    app.use(bodyParser.json());

    // Disable CORS in development mode
    if(process.env.ENV !== 'prod') {
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        });   
    }

    // Initialize the routes
    app.use('/docs', express.static('docs'));
    app.use('/user', UserRouter);
    app.use('/friend', FriendRouter);

    // Handle 404
    app.use((req, res, next) => {
        next(new HTTPError(404, 'Not Found'));
    });

    // Handle errors
    app.use((err: HTTPError, req, res, next) => {
        // Specific HTTP error
        if(err.status) {
            return res.status(err.status).json({ message: err.message });
        }

        // Generic error, log it and turn it into a 500
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    });

    // Start the server
    app.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
}).catch(error => console.log(error));