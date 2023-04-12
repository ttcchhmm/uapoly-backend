import { Router } from "express";
import { authenticateRequest } from "../auth/Auth";
import { AuthenticatedRequest } from "../auth/AuthenticatedRequest";
import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { Account } from "../entity/Account";
import { Player } from "../entity/Player";
import { checkBody } from "../utils/CheckBody";
import { AmericanSlots } from "../defaults/AmericanSlots";
import { BoardSlot } from "../entity/BoardSlot";

/**
 * The router for the /game endpoint.
 */
export const GameRouter = Router();

const boardRepo = AppDataSource.getRepository(Board);
const accountRepo = AppDataSource.getRepository(Account);
const playerRepo = AppDataSource.getRepository(Player);
const slotRepo = AppDataSource.getRepository(BoardSlot);

// ### GAME MANAGEMENT ### //

GameRouter.post('/create', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'salary')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Get the user
    const user = await accountRepo.findOneBy({login: req.user.login});

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const board = new Board();
    const player = new Player();

    // TODO: Review default values ?

    player.account = user;
    player.game = board;
    player.gameId = board.id;
    player.money = 2500;
    player.iconStyle = 0;
    player.outOfJailCards = 0;
    player.currentSlotIndex = 0;
    player.inJail = false;
    player.isGameMaster = true;

    board.players = [player];
    board.jackpot = 0;
    board.salary = req.body.salary;

    await boardRepo.save(board);

    // TODO: Allow for custom slots and/or other default sets.
    board.slots = AmericanSlots.map((slot) => {
        slot.board = board;
        slot.boardId = board.id;

        return slot;
    });

    // Save the new game in the database
    await Promise.all([boardRepo.save(board), playerRepo.save(player)]);

    return res.status(200).json({ gameId: board.id });
});

GameRouter.post('/list', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'page')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Check if the page number is valid
    if(isNaN(req.body.page) || req.body.page <= 0) {
        return res.status(400).json({ message: 'Invalid page number' });
    }

    // Get the boards
    const pageSize = 10;
    const skipOffset = (req.body.page - 1) * pageSize;

    const boards = await boardRepo.createQueryBuilder('board')
        .skip(skipOffset)
        .take(pageSize)
        .getMany();

    return res.status(200).json(boards);
});

GameRouter.post('/join', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    if(!checkBody(req.body, 'gameId')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Get the user
    const user = await accountRepo.findOneBy({login: req.user.login});

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Get the board
    const board = await boardRepo.findOneBy({id: req.body.gameId});

    // Check if the board exists
    if(!board) {
        return res.status(404).json({ message: 'Game not found' });
    }

    // Check if the user is already in the game
    const player = await playerRepo.findOneBy({accountLogin: user.login, gameId: board.id});

    if(player) {
        return res.status(400).json({ message: 'You are already in this game' });
    }

    // Create the player
    const newPlayer = new Player();
    newPlayer.game = board;
    newPlayer.gameId = board.id;
    newPlayer.account = user;
    newPlayer.accountLogin = user.login;
    newPlayer.money = 2500;
    newPlayer.iconStyle = 0;
    newPlayer.outOfJailCards = 0;
    newPlayer.currentSlotIndex = 0;
    newPlayer.inJail = false;
    newPlayer.isGameMaster = false;

    // Save the player
    await playerRepo.save(newPlayer);

    return res.status(200).json({ message: 'Joined game' });

});

GameRouter.post('/delete', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // TODO
});