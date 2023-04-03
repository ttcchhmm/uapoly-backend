import { Router } from 'express';
import { login, hashPassword } from '../auth/Auth';
import { AppDataSource } from '../data-source';
import { Account } from '../entity/Account';
import { checkBody } from '../utils/CheckBody';

/**
 * The router for the /user endpoint.
 */
export const UserRouter = Router();

const accountRepo = AppDataSource.getRepository(Account);

UserRouter.post('/login', async (req, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'login', 'password')) {
        return res.status(400).json({ message: 'Missing login or password' });
    }

    // Get the user
    const user = await accountRepo.createQueryBuilder('account')
        .addSelect('account.password')
        .where('account.login = :login', { login: req.body.login })
        .getOne();

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    try {
        const token = await login(user, req.body.password);
        return res.json({ token });
    } catch(error) { // Invalid password
        return res.status(401).json({ message: error.message });
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

    // At least 6 characters
    if(req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password too short' });
    }

    // Check if the login is already taken
    const { loginCount } = await accountRepo.createQueryBuilder('account')
        .select('COUNT(account.login)', 'loginCount')
        .where('account.login = :login', { login: req.body.login })
        .getRawOne();

    if(loginCount != 0) {
        return res.status(409).json({ message: 'Login already taken' });
    }

    // Create the account
    const user = new Account();
    user.login = req.body.login;
    user.email = req.body.email;
    user.password = await hashPassword(req.body.password);

    await accountRepo.save(user);

    return res.status(201).json({ token: await login(user, req.body.password) });
});