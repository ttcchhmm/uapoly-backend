import { Router } from "express";
import { AuthenticatedRequest } from "../auth/AuthenticatedRequest";
import { authenticateRequest } from "../auth/Auth";
import { AppDataSource } from "../data-source";
import { Account } from "../entity/Account";
import { Friend } from "../entity/Friend";
import { checkBody } from "../utils/CheckBody";

/**
 * The router for the /friend endpoint.
 */
export const FriendRouter = Router();

const accountRepo = AppDataSource.getRepository(Account);
const friendRepo = AppDataSource.getRepository(Friend);

FriendRouter.get('/', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    const account = await accountRepo.findOneBy({ login: req.user.login });

    if(!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    return res.json(await account.getFriends());
});

FriendRouter.get('/pending', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    const account = await accountRepo.findOneBy({ login: req.user.login });

    if(!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    return res.json({
        sent: (await account.sentFriendRequests).filter(friend => !friend.accepted),
        received: (await account.receivedFriendRequests).filter(friend => !friend.accepted),
    });
});

FriendRouter.post('/add', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'login')) {
        return res.status(400).json({ message: 'Missing friend login' });
    }

    // Check if the friend is not the current account
    if(req.body.login === req.user.login) {
        return res.status(400).json({ message: 'Cannot add yourself' });
    }

    // Find the current account
    const account = await accountRepo.findOneBy({ login: req.user.login });

    if(!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    // Find the friend
    const friend = await accountRepo.findOneBy({ login: req.body.login });

    // Check if the friend exists
    if(!friend) {
        return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if the friend is already added
    if(account.isFriendWith(friend)) {
        return res.status(400).json({ message: 'Already friends' });
    }

    // Check if the friend request has already been sent
    if((await account.sentFriendRequests).some(friend => friend.secondAccountLogin === req.body.login)) {
        return res.status(400).json({ message: 'Friend request already sent' });
    }

    // The received friend request if it exists, undefined otherwise
    const receivedRequest = (await account.receivedFriendRequests).find(friend => friend.firstAccountLogin === req.body.login && !friend.accepted);

    console.log({
        receivedRequest,
        friends: account.getFriends(),
        isFriend: account.isFriendWith(friend),
        receivedRequests: account.receivedFriendRequests,
        sentRequest: account.sentFriendRequests,
    });

    if(receivedRequest) { // Accept the friend request
        receivedRequest.accepted = true;
        await friendRepo.save(receivedRequest);
        return res.json({ message: 'Friend request accepted' });
    } else { // Send a friend request
        const newFriend = new Friend();
        newFriend.firstAccountLogin = account.login;
        newFriend.secondAccountLogin = friend.login;
        newFriend.accepted = false;

        await friendRepo.save(newFriend);
        return res.json({ message: 'Friend request sent' });
    }
});