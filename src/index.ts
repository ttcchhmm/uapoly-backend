import { GameManager } from './game/GameManager';

// Generate a graph of the state machine if needed
if(process.argv.includes('--dump-state-machine')) {
    GameManager.dumpMachineGraph('./state-machine.dot');
    console.log('Dumped state machine to ./state-machine.dot');
    process.exit(0);
}

// Reading the config file
import dotenv from 'dotenv';
dotenv.config();

// Warn the user if they are running in development mode
import child_process from 'child_process';

if(process.env.ENV !== 'prod') {
    console.warn('WARNING: Running in development mode.');
    console.warn('WARNING: Using this mode in production CAN CAUSE DATA LOSS !!!');
    console.warn('WARNING: CORS will be disabled. (This is a security risk).')
    console.warn('WARNING: If this is a production environment, please set the ENV variable to "prod" in the .env file.');
    
    // Allows the user to skip the wait (useful for debugging with nodemon)
    if(!process.argv.includes('--skip-warnings-wait')) {
        console.warn('WARNING: Waiting 5 seconds before continuing... (Use --skip-warnings-wait to skip this warning)')
        child_process.execSync('sleep 5'); // Can't use setTimeout because it's async
    }
}

import { AppDataSource } from "./data-source";
import express, { Express, NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import { createServer } from 'http';
import { Server } from "socket.io";
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import hpp from 'hpp';

import { UserRouter } from "./routes/UserRouter";
import { FriendRouter } from './routes/FriendRouter';
import { HTTPError } from './utils/HTTPError';
import { GameRouter } from './routes/GameRouter';
import { authenticateSocket } from './auth/Auth';
import { onConnect } from './socket/GameSocket';
import { setIo } from './socket/IoGlobal';

// Initialize the database
AppDataSource.initialize().then(async () => {
    console.log('Database connection established');

    // Initialize express
    const app: Express = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(hpp());

    // Disable CORS in development mode
    if(process.env.ENV !== 'prod') {
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        });   
    }

    // Initialize the routes
    app.use('/docs', express.static('docs'));
    app.use('/user', UserRouter);
    app.use('/friend', FriendRouter);
    app.use('/game', GameRouter);

    // Handle 404
    app.use((req: Request, res: Response, next: NextFunction) => {
        next(new HTTPError(404, 'Not Found'));
    });

    // Handle errors
    app.use((err: HTTPError, req: Request, res: Response, next: NextFunction) => {
        // Specific HTTP error
        if(err.status) {
            return res.status(err.status).json({ message: err.message });
        }

        // Generic error, log it and turn it into a 500
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    });

    // Set up Redis
    const redisClient = createClient({url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || '6379'}`});
    await redisClient.connect();
    console.log('Redis connection established');

    // Initialize the socket.io server
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        adapter: createAdapter(redisClient),
        connectionStateRecovery: {
            maxDisconnectionDuration: 60 * 1000, // 1 minute
            skipMiddlewares: true,
        }
    });

    // Force authentication
    io.use(authenticateSocket);

    // Handle socket connections
    io.on('connection', onConnect);

    setIo(io);

    // Start the server
    httpServer.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
}).catch(error => console.log(error));