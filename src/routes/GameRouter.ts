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
    if(!checkBody(req.body, 'salary')) {
        return res.status(400).json({ message: 'Missing arguments' });
    }

    const user = await accountRepo.findOneBy({login: req.user.login});

    if(!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const board = new Board();
    const player = new Player();

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

    await boardRepo.save(board);

    await playerRepo.save(player);

    return res.status(200).json({ gameId: board.id });
});

GameRouter.get('/list', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // TODO
});

GameRouter.post('/join', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // TODO
});

GameRouter.post('/delete', authenticateRequest, async (req: AuthenticatedRequest, res) => {
    // TODO
});