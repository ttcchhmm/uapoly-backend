import { Router } from 'express';
import * as Auth from '../auth/Auth';
import { AuthenticatedRequest } from '../auth/AuthenticatedRequest';
import { AppDataSource } from '../data-source';
import { Account } from '../entity/Account';
import { checkBody } from '../utils/CheckBody';
import md5 from 'md5';

/**
 * The router for the /user endpoint.
 */
export const UserRouter = Router();

const accountRepo = AppDataSource.getRepository(Account);

// ### ACCOUNT MANAGEMENT ### //

UserRouter.post('/login', async (req, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'login', 'password')) {
        return res.status(400).json({ message: 'Missing login or password' });
    }

    // Get the user
    const user = await accountRepo.createQueryBuilder('account')
        .addSelect('account.password')
        .where('account.login = :login', { login: req.body.login })
        .cache(true)
        .getOne();

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    try {
        const token = await Auth.login(user, req.body.password);
        return res.json({ token });
    } catch(error) { // Invalid password
        if(error instanceof Error) {
            return res.status(401).json({ message: error.message });
        } else {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
});

UserRouter.post('/register', async (req, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'login', 'password', 'email')) {
        return res.status(400).json({ message: 'Missing login, password or email' });
    }

    // Only English characters & numbers & dashes (-, _). Between 4 and 15 characters
    if(!/^([a-zA-Z]|[0-9]|-|_){4,15}$/.test(req.body.username)) {
        return res.status(400).json({ message: 'Invalid login' });
    }

    // Check if the email is valid
    if(!Auth.matchEmail(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email' });
    }

    // Security check
    if(!Auth.matchSecurityBaseline(req.body.password)) {
        return res.status(400).json({ message: 'Password too short' });
    }

    // Check if the login is already taken
    const loginCount = await accountRepo.count({
        where: {
            login: req.body.login,
        },
        cache: true,
    });

    if(loginCount != 0) {
        return res.status(409).json({ message: 'Login already taken' });
    }

    // Create the account
    const user = new Account();
    user.login = req.body.login;
    user.email = req.body.email;
    user.password = await Auth.hashPassword(req.body.password);

    await accountRepo.save(user);

    return res.status(201).json({ token: await Auth.login(user, req.body.password) });
});

UserRouter.post('/change-password', Auth.authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'oldPassword', 'newPassword')) {
        return res.status(400).json({ message: 'Missing oldPassword or newPassword' });
    }

    if(!Auth.matchSecurityBaseline(req.body.newPassword)) {
        return res.status(400).json({ message: 'New password does not match security requirements' });
    }

    // Query the user
    const user = await accountRepo.findOne({
        where: {
            login: req.user.login,
        },
        select: {
            login: true,
            password: true,
        },
        cache: true,
    });

    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    if(!await Auth.checkPassword(req.body.oldPassword, user.password)) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    // Update the password
    user.password = await Auth.hashPassword(req.body.newPassword);
    await accountRepo.save(user);

    return res.status(200).json({ message: 'Password changed' });
});

UserRouter.post('/change-email', Auth.authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'email', 'password')) {
        return res.status(400).json({ message: 'Missing email or password' });
    }

    // Check if the email is valid
    if(!Auth.matchEmail(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email' });
    }

    // Query the user
    const user = await accountRepo.findOne({
        where: {
            login: req.user.login,
        },
        select: {
            login: true,
            password: true,
        },
        cache: true,
    });

    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    if(!await Auth.checkPassword(req.body.password, user.password)) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    // Update the email
    user.email = req.body.email;
    await accountRepo.save(user);

    return res.status(200).json({ message: 'Email changed' });
});

// ### USER INFO ### //

UserRouter.get('/me', Auth.authenticateRequest, async (req: AuthenticatedRequest, res) => {
    const user = await accountRepo.createQueryBuilder('account')
        .where('account.login = :login', { login: req.user.login })
        .addSelect('account.email')
        .cache(true)
        .getOne();

    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
});

UserRouter.post('/search', Auth.authenticateRequest, async (req: AuthenticatedRequest, res) => {
    if(!checkBody(req.body, 'login') || req.body.login.length <= 0) {
        return res.status(400).json({ message: 'Missing login' });
    }

    if(req.body.page && isNaN(req.body.page) || req.body.page < 1) {
        return res.status(400).json({ message: 'Invalid page' });
    }

    const pageSize = 10;
    const skipOffset = req.body.page ? (req.body.page - 1) * pageSize : 0;

    const users = await accountRepo.createQueryBuilder('account')
        .where('account.login LIKE :login', { login: `%${req.body.login}%` })
        .skip(skipOffset)
        .take(pageSize)
        .cache(true)
        .getMany();

    return res.json(users);
});

UserRouter.get('/picture/:username', async (req, res) => {
    if(!req.params.username) {
        return res.status(400).json({ message: 'Missing username' });
    }

    // Query the user
    const user = await accountRepo.findOne({
        where: {
            login: req.params.username,
        },
        select: {
            email: true,
            login: false,
        },
        cache: true,
    });

    // If the user does not exist, return a default avatar
    if(!user) {
        return res.redirect(`https://www.gravatar.com/avatar/default?s=38&d=mp&r=pg&f=y`);
    }

    // If the user has an avatar, return it
    return res.redirect(`https://www.gravatar.com/avatar/${md5(user.email)}?s=38&d=robohash&r=pg`);
});