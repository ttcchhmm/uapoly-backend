import { Router } from "express";
import { authenticateRequest, checkPassword, hashPassword } from "../auth/Auth";
import { AuthenticatedRequest } from "../auth/AuthenticatedRequest";
import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { Account } from "../entity/Account";
import { Player } from "../entity/Player";
import { checkBody } from "../utils/CheckBody";
import { Friend } from "../entity/Friend";
import { PGSQL_MAX_INT } from "../utils/PgsqlConstants";
import { BoardSlot } from "../entity/BoardSlot";
import { Slots } from "../defaults/Slots";

/**
 * The router for the /game endpoint.
 */
export const GameRouter = Router();

const boardRepo = AppDataSource.getRepository(Board);
const accountRepo = AppDataSource.getRepository(Account);
const playerRepo = AppDataSource.getRepository(Player);
const friendRepo = AppDataSource.getRepository(Friend);
const slotsRepo = AppDataSource.getRepository(BoardSlot);

// ### GAME MANAGEMENT ### //

GameRouter.post('/create', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'salary', 'initialMoney', 'friendsOnly', 'locale', 'name')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Get the user
    const user = await accountRepo.findOne({
        where: {
            login: req.user.login,
        },
        cache: true,
    });

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if(req.body.maxPlayers && req.body.maxPlayers < 2) {
        return res.status(400).json({ message: 'Invalid max players' });
    }

    if(req.body.initialMoney <= 0) {
        return res.status(400).json({ message: 'Invalid initial money' });
    }

    if(!Slots.has(req.body.locale)) {
        return res.status(404).json({ message: 'Locale not found' });
    }

    const board = new Board();

    // TODO: Review default values ?

    board.name = req.body.name;
    board.jackpot = 0;
    board.salary = req.body.salary;
    board.initialMoney = req.body.initialMoney;
    board.startingSlotIndex = 0;
    board.maxPlayers = req.body.maxPlayers ? req.body.maxPlayers : PGSQL_MAX_INT;
    board.friendsOnly = req.body.friendsOnly;
    board.started = false;
    board.currentPlayerIndex = 0;

    // If a password is provided, set it
    if(req.body.password) {
        board.password = await hashPassword(req.body.password);
    } else { // Public game
        board.password = null;
    }

    await boardRepo.save(board);

    const player = new Player();

    player.game = board;
    player.gameId = board.id;
    player.account = user;
    player.money = req.body.initialMoney;
    player.iconStyle = 0;
    player.outOfJailCards = 0;
    player.currentSlotIndex = 0;
    player.inJail = false;
    player.isGameMaster = true;

    board.players = [player];

    // TODO: Allow for custom slots and/or other default sets.
    board.slots = Slots.get(req.body.locale).slots().map((slot) => {
        slot.board = board;
        slot.boardId = board.id;

        return slot;
    });

    // Save the new game in the database
    await boardRepo.save(board);
    await playerRepo.save(player);

    return res.status(200).json(board.getSimplified());
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
    const board = await boardRepo.findOne({
        select: {
            id: true,
            password: true,
            initialMoney: true,
            started: true,
            maxPlayers: true,
            friendsOnly: true,
            startingSlotIndex: true,
        },
        where: {
            id: req.body.gameId
        },
        relations: ['players'],
        loadEagerRelations: false,
        cache: true,
    });

    // Check if the board exists
    if(!board) {
        return res.status(404).json({ message: 'Game not found' });
    }

    // Check if the user is already in the game
    const player = await playerRepo.findOne({
        where: {
            accountLogin: user.login,
            gameId: board.id,
        },
        cache: true,
    });

    if(player) {
        return res.status(400).json({ message: 'You are already in this game' });
    }

    // Check if the game started
    if(board.started) {
        return res.status(400).json({ message: 'This game has already started' });
    }

    // Check if the game is full
    if(board.maxPlayers <= board.players.length) {
        return res.status(400).json({ message: 'This game is full' });
    }

    // Check if the game is friends only
    if(board.friendsOnly) {
        const friendCount = await friendRepo.count({
            where: [
                {
                    firstAccountLogin: user.login,
                    secondAccountLogin: board.getGameMaster().accountLogin,
                    accepted: true,
                },
                {
                    firstAccountLogin: board.getGameMaster().accountLogin,
                    secondAccountLogin: user.login,
                    accepted: true,
                }
            ],
            cache: true,
        });

        if(friendCount === 0) {
            return res.status(403).json({ message: 'You are not friends with the game master' });
        }
    }

    if(board.password) {
        if(!checkBody(req.body, 'password')) { // Check if the password is provided
            return res.status(401).json({ message: 'Missing password' });
        } else if(!await checkPassword(req.body.password, board.password)) { // Check if the password is correct
            return res.status(403).json({ message: 'Invalid password' });
        }
    }

    // Create the player
    const newPlayer = new Player();
    newPlayer.game = board;
    newPlayer.gameId = board.id;
    newPlayer.account = user;
    newPlayer.accountLogin = user.login;
    newPlayer.money = board.initialMoney;
    newPlayer.iconStyle = board.players.length;
    newPlayer.outOfJailCards = 0;
    newPlayer.currentSlotIndex = board.startingSlotIndex;
    newPlayer.inJail = false;
    newPlayer.isGameMaster = false;

    // Save the player
    await playerRepo.save(newPlayer);

    return res.status(200).json({ message: 'Joined game' });
});

GameRouter.post('/leave', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    if(!checkBody(req.body, 'gameId')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Get the user
    const user = await accountRepo.findOne({
        where: {
            login: req.user.login,
        },
        cache: true,
    });

    // Check if the user exists
    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Get the board
    const board = await boardRepo.findOne({
        select: {
            id: true,
        },
        where: {
            id: req.body.gameId
        },
        relations: ['players'],
        loadEagerRelations: false,
        cache: true
    });

    // Check if the board exists
    if(!board) {
        return res.status(404).json({ message: 'Game not found' });
    }

    // Get the player
    const player = await playerRepo.findOne({
        where: {
            accountLogin: user.login,
            gameId: board.id,
        },
        cache: true,
    });

    // Check if the user is in the game
    if(!player) {
        return res.status(400).json({ message: 'You are not in this game' });
    }

    // Check if the game started
    if(board.started) {
        throw new Error('NOT IMPLEMENTED: Bankrupt player when leaving a started game'); // TODO: Bankrupt player
    }

    // Check if the player was the game master
    if(player.isGameMaster) {
        if(board.players.length === 1) { // Now the game is empty
            // Remove the player
            await playerRepo.remove(player);

            // Remove the board
            await slotsRepo.delete({ boardId: board.id });
            await boardRepo.remove(board);
        } else { // There are still players in the game
            // Get the next player
            const nextPlayer = board.players.find((p) => p.accountLogin !== player.accountLogin);

            // Make the next player the game master
            nextPlayer.isGameMaster = true;

            await Promise.all([
                playerRepo.save(nextPlayer),
                playerRepo.remove(player), // Remove the player
            ]);
        }
    }

    return res.status(200).json({ message: 'Left game' });
});

// ### GAME SEARCH ### //

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

    const [boards, boardCount] = await Promise.all([
        boardRepo.createQueryBuilder('board')
        .addSelect('board.password')
        .leftJoinAndSelect('board.players', 'players')
        .skip(skipOffset)
        .take(pageSize)
        .cache(true)
        .getMany(),

        boardRepo.count({cache: true}),
    ]);

    return res.status(200).json({
        pageCount: Math.ceil(boardCount / pageSize),
        games : boards.map((board) => board.getSimplified()),
    });
});

GameRouter.post('/search', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // Check if the body contains the required fields
    if(!checkBody(req.body, 'name') || req.body.name.length <= 0) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    // Check if the page number is valid
    if(req.body.page && isNaN(req.body.page) || req.body.page < 1) {
        return res.status(400).json({ message: 'Invalid page' });
    }

    const pageSize = 10;
    const skipOffset = req.body.page ? (req.body.page - 1) * pageSize : 0;

    // Get the boards
    const boards = await boardRepo.createQueryBuilder('board')
        .where('board.name LIKE :name', { name: `%${req.body.name}%` })
        .leftJoinAndSelect('board.players', 'players')
        .skip(skipOffset)
        .take(pageSize)
        .cache(true)
        .getMany();

    return res.json(boards.map((board) => board.getSimplified()));
});

// ### DEFAULT BOARDS ### //

GameRouter.get('/boards', (req, res) => {
    const response: any = {};

    Slots.forEach((value, key) => {
        response[key] = value.name;
    });

    return res.status(200).json(response);
});

GameRouter.post('/boards', (req, res) => {
    if(!checkBody(req.body, 'locale')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    if(!Slots.has(req.body.locale)) {
        return res.status(404).json({ message: 'Invalid locale' });
    }

    return res.status(200).json(Slots.get(req.body.locale).slots().map((slot: BoardSlot) => slot.getSimplified()));
});