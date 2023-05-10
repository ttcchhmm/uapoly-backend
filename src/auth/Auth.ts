import bcrypt from 'bcrypt';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { Account } from '../entity/Account';
import { Token } from './Token';
import { AuthenticatedRequest } from './AuthenticatedRequest';
import { NextFunction, Response } from 'express';
import { AuthenticatedSocket } from './AuthenticatedSocket';
import * as EmailValidator from 'email-validator';

/**
 * Passwords will go through 2^(this constant) rounds of hashing.
 * 
 * See : https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
 */
const saltRounds = 10;

/**
 * Hashes a password.
 * @param password The password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
}

/**
 * Checks if a password matches a hash.
 * @param password The password to check.
 * @param hash The hash to check against.
 * @returns A promise that resolves to true if the password matches the hash.
 */
export function checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Checks if a password matches the security baseline.
 * @param password The password to check.
 * @returns True if the password matches the security baseline.
 */
export function matchSecurityBaseline(password: string): boolean {
    return password.length >= 6;
}

/**
 * Checks if an email address is valid.
 * 
 * See : https://www.npmjs.com/package/email-validator
 * 
 * @param email The email address to check.
 * @returns True if the email address is valid.
 */
export function matchEmail(email: string): boolean {
    return EmailValidator.validate(email);
}

/**
 * Logs a user in.
 * @param account The account to log in.
 * @param password The password to check.
 * @returns A promise that resolves to the JWT token.
 */
export async function login(account: Account, password: string): Promise<string> {
    if(await checkPassword(password, account.password)) {
        const payload: Token = {
            login: account.login,
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION,
        });
    } else {
        throw new Error('Invalid password');
    }
}

/**
 * Authenticates a token.
 * @param token The token to authenticate.
 * @param success Callback called if the token is valid.
 * @param failure Callback called if the token is invalid.
 */
function authenticate(token: string, success: (payload: Token) => void, failure: (err: VerifyErrors) => void) {
    jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors | null, payload: object | undefined) => {
        if(err) {
            failure(err);
        } else {
            success(payload as Token);
        }
    });
}

/**
 * An Express middleware that checks if the request is authenticated.
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if(authHeader) { // Check if the header is present
        const header = authHeader.split(' ');

        // Check if the header is valid
        if(header.length !== 2 || header[0] !== 'Bearer') {
            res.status(400).json({
                error: 'Invalid authorization header',
            });
        }

        authenticate(header[1], (payload: Token) => {
            req.user = payload;
            next();
        }, (err: VerifyErrors) => {
            res.status(403).json({
                error: 'Invalid token',
            });
        });
    } else { // Invalid header
        res.status(401).json({
            error: 'No token provided',
        });
    }
}

/**
 * A Socket.io middleware that checks if the socket is authenticated.
 * @param socket The socket to authenticate
 * @param next The next middleware
 */
export function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token;
    if(!token) {
        socket.emit('error', {
            message: 'No token provided',
            gameId: null,
        });

        return next(new Error('No token provided'));
    }

    authenticate(token, (payload: Token) => {
        socket.user = payload;
        next();
    }, (err: VerifyErrors) => {
        socket.emit('error', {
            message: 'Invalid token',
            gameId: null,
        });
        
        return next(new Error('Invalid token'));
    });
}