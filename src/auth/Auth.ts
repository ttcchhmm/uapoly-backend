import bcrypt from 'bcrypt';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { Account } from '../entity/Account';
import { Token } from './Token';

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