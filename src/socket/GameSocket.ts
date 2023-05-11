import { AuthenticatedSocket } from "../auth/AuthenticatedSocket";
import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { BuyableSlotTrade } from "../entity/BuyableSlotTrade";
import { Message } from "../entity/Message";
import { MoneyTrade } from "../entity/MoneyTrade";
import { Player } from "../entity/Player";
import { TradeItem } from "../entity/TradeItem";
import { TradeOffer } from "../entity/TradeOffer";
import { Manager, PropertyEdit } from "../game/GameManager";
import { GameTransitions } from "../game/GameTransitions";
import { checkBody } from "../utils/CheckBody";
import { getIo } from "./IoGlobal";

const playerRepo = AppDataSource.getRepository(Player);
const boardRepo = AppDataSource.getRepository(Board);
const messageRepo = AppDataSource.getRepository(Message);
const tradeOfferRepo = AppDataSource.getRepository(TradeOffer);
const tradeItemRepo = AppDataSource.getRepository(TradeItem);

/**
 * Function called when a socket connects, after authentication.
 * @param socket The socket that connected
 */
export function onConnect(socket: AuthenticatedSocket) {
    // Set up the socket events
    socket.on('join', onJoin(socket));
    socket.on('leave', onLeave(socket));
    socket.on('start', onStart(socket));
    socket.on('update', onUpdate(socket));
    socket.on('declareBankruptcy', onDeclareBankruptcy(socket));
    socket.on('nextPlayer', onNextPlayer(socket));
    socket.on('manageProperties', onManageProperties(socket));
    socket.on('buy', onBuy(socket));
    socket.on('doNotBuy', onDoNotBuy(socket));
    socket.on('message', onMessage(socket));
    socket.on('trade', onTrade(socket));

    // Resend the state of the game if the socket was disconnected
    if(socket.recovered) {
        socket.emit('recovered');
        socket.rooms.forEach(room => {
            const split = room.split('-');
            updateRoom(socket, parseInt(split[1]), false);
        });
    }
}

/**
 * Generate an error message object.
 * @param room The room concerned by the error
 * @param message The error message
 * @returns An object containing the room and the error message
 */
function getErrorMessage(room: number, message: string) {
    return {gameId: room, message};
}

// ### SOCKET EVENTS ### //

/**
 * Get a function that will be called when the socket emits a 'join' event, to join a room.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'join' event
 */
function onJoin(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }
        
        const player = await playerRepo.findOne({
            where: {
                gameId: room,
                accountLogin: socket.user.login,
            },
            relations: ['game'],
            cache: true,
        });

        if (!player) {
            socket.emit('error', getErrorMessage(room, 'You are not in this game'));
            return;
        }

        socket.to(`game-${room}`).emit('player-connected', {gameId: room, player: player.accountLogin});
        await socket.join(`game-${room}`);
        socket.emit('joined', player.game);
    };
}

/**
 * Get a function that will be called when the socket emits a 'leave' event, to leave a room.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'leave' event
 */
function onLeave(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        if(socket.rooms.has(`game-${room}`)) {
            await socket.leave(`game-${room}`);
            socket.emit('left', room);

            const player = await playerRepo.findOne({
                where: {
                    gameId: room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            });

            socket.to(`game-${room}`).emit('player-disconnected', {gameId: room, player: player.accountLogin});
        } else {
            socket.emit('error', getErrorMessage(room, 'You did not join this game'));
        }
    };
}

/**
 * Get a function that will be called when the socket emits a 'start' event, to start a game.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'start' event
 */
function onStart(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        const board = await boardRepo.findOne({
            where: {
                id: room,
            },
            relations: ['players'],
            cache: true,
        });

        if (!board) {
            socket.emit('error', getErrorMessage(room, 'This game does not exist'));
            return;
        }

        if(board.started) {
            socket.emit('error', getErrorMessage(room, 'This game has already started'));
            return;
        }

        if (board.players.length < 2) {
            socket.emit('error', getErrorMessage(room, 'You need at least 2 players to start the game'));
            return;
        }

        board.started = true;
        await boardRepo.save(board);

        await updateRoom(socket, room);

        Manager.startGame(board);
    };
}

/**
 * Get a function that will be called when the socket emits a 'update' event, to force get the state of the game.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'update' event
 */
function onUpdate(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        await updateRoom(socket, room, false);
    }
}

/**
 * Get a function that will be called when the socket emits a 'declareBankruptcy' event, to declare bankruptcy.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'declareBankruptcy' event
 */
function onDeclareBankruptcy(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: room,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);
    
        if(checkBoardAndPlayerValidity(board, player, socket, room)) {
            Manager.games.get(room).transition(GameTransitions.DECLARE_BANKRUPTCY, { board: board });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'nextPlayer' event, to pass the turn to the next player.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'nextPlayer' event
 */
function onNextPlayer(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: room,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, room)) {
            Manager.games.get(room).transition(GameTransitions.NEXT_PLAYER, { board: board });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'manageProperties' event, to manage properties.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'manageProperties' event
 */
function onManageProperties(socket: AuthenticatedSocket) {
    return async (data: { room: number, properties: PropertyEdit[] }) => {
        if(isNaN(data.room)) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid game ID'));
            return;
        } else if(!Array.isArray(data.properties)) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid properties'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: data.room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.room,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);

        data.properties.forEach(p => {
            if(isNaN(p.position)) {
                socket.emit('error', getErrorMessage(data.room, 'Invalid properties'));
                return;
            } else if(!player.ownedProperties.find(op => op.position === p.position)) {
                socket.emit('error', getErrorMessage(data.room, `You do not own this property: ${p.position}`));
                return;
            }
        });

        if(checkBoardAndPlayerValidity(board, player, socket, data.room)) {
            Manager.games.get(data.room).transition(GameTransitions.MANAGE_PROPERTIES, { board: board, propertiesEdit: data.properties });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'doNotBuy' event, to not buy a property.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'doNotBuy' event
 */
function onDoNotBuy(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: room,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, room)) {
            Manager.games.get(room).transition(GameTransitions.DO_NOT_BUY_PROPERTY, { board: board });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'buy' event, to buy a property.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'buy' event
 */
function onBuy(socket: AuthenticatedSocket) {
    return async (room: number) => {
        if(isNaN(room)) {
            socket.emit('error', getErrorMessage(room, 'Invalid game ID'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: room,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, room)) {
            Manager.games.get(room).transition(GameTransitions.BUY_PROPERTY, { board: board });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'message' event, to send a message.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'message' event
 */
function onMessage(socket: AuthenticatedSocket) {
    return async(data: { room: number, message: string, recipient: string | undefined }) => {
        if(isNaN(data.room)) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid game ID'));
            return;
        } else if(typeof data.message !== 'string' || data.message.length === 0) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid message'));
            return;
        }

        // Get the player and the board
        const promises = [
            playerRepo.findOne({
                where: {
                    gameId: data.room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.room,
                },
                cache: true,
            }),
        ];

        // Get the recipient if it exists
        if(data.recipient && typeof data.recipient === 'string') {
            promises.push(playerRepo.findOne({
                where: {
                    gameId: data.room,
                    accountLogin: data.recipient,
                },
                cache: true,
            }));
        }

        const [player, board, recipient] = await Promise.all(promises);

        // If a recipient was specified, check if it exists within the game
        if(data.recipient && !recipient) {
            socket.emit('error', getErrorMessage(data.room, `This player does not exist: ${data.recipient}`));
            return;
        }

        if(checkBoardAndPlayerValidity(board as Board, player as Player, socket, data.room)) {
            const msg = new Message(board as Board, data.message, player as Player, recipient as Player);
            (board as Board).messages.push(msg);

            await Promise.all([
                boardRepo.save(board as Board),
                messageRepo.save(msg),
            ]);

            getIo().to(`game-${data.room}`).emit('message', {
                unsafe: true, // TODO: Update this when the private message functionality is actually private
                ...msg,
            });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'trade' event, to trade with another player.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'trade' event
 */
function onTrade(socket: AuthenticatedSocket) {
    return async (data: { room: number, propertiesOffered: number[], moneyOffered: number, propertiesRequested: number[], moneyRequested: number, recipient: string, message: string | undefined }) => {
        // Sanity checks
        if(!checkBody(data, 'room', 'propertiesOffered', 'moneyOffered', 'propertiesRequested', 'moneyRequested', 'recipient')) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid properties'));
            return;
        }

        if(isNaN(data.room)) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid game ID'));
            return;
        }

        if(data.moneyOffered <= 0 || data.moneyRequested <= 0) {
            socket.emit('error', getErrorMessage(data.room, 'Invalid money'));
            return;
        }

        // Get the player, board and recipient
        const [player, board, recipient] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: data.room,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.room,
                },
                relations: ['players'],
                cache: true,
            }),
            playerRepo.findOne({
                where: {
                    gameId: data.room,
                    accountLogin: data.recipient,
                },
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, data.room, false)) {
            // Fetch the properties
            const offered: TradeItem[] = [];
            const requested: TradeItem[] = [];

            data.propertiesOffered.forEach((id) => {
                const property = player.ownedProperties.find((p) => p.position === id);

                if(!property) {
                    socket.emit('error', getErrorMessage(data.room, `Invalid property: ${id}`));
                    return;
                }

                offered.push(new BuyableSlotTrade(property));
            });

            data.propertiesRequested.forEach((id) => {
                const property = recipient.ownedProperties.find((p) => p.position === id);

                if(!property) {
                    socket.emit('error', getErrorMessage(data.room, `Invalid property: ${id}`));
                    return;
                }

                requested.push(new BuyableSlotTrade(property));
            });

            // Add money trades
            offered.push(new MoneyTrade(data.moneyOffered));
            requested.push(new MoneyTrade(data.moneyRequested));

            // Build the offer
            const trade = new TradeOffer();
            trade.offered = offered;
            trade.requested = requested;

            // Create the message
            const msg = new Message(board, data.message || '', player, recipient, trade)
            board.messages.push(msg);

            // Save everything
            const promises: Promise<any>[] = offered.map((item) => tradeItemRepo.save(item));
            promises.concat(requested.map((item) => tradeItemRepo.save(item)));
            promises.push(tradeOfferRepo.save(trade));
            promises.push(messageRepo.save(msg));
            promises.push(boardRepo.save(board));

            await Promise.all(promises);

            // Send the message
            getIo().to(`game-${data.room}`).emit('message', {
                unsafe: true, // TODO: Update this when the private message functionality is actually private
                ...msg,
            });
        }
    }
}

/**
 * Check if the board and player are valid, and send an error if they are not.
 * @param board The board to check
 * @param player The player to check
 * @param socket The socket to send an error to
 * @param room The room to send an error to
 * @param checkTurn Whether to check if it is the player's turn
 * @returns True if the board and player are valid, false otherwise
 */
function checkBoardAndPlayerValidity(board: Board, player: Player, socket: AuthenticatedSocket, room: number, checkTurn = true) {
    if (!player) {
        socket.emit('error', getErrorMessage(room, 'You are not in this game'));
        return false;
    }

    if (!board) {
        socket.emit('error', getErrorMessage(room, 'This game does not exist'));
        return false;
    }

    if (!board.started) {
        socket.emit('error', getErrorMessage(room, 'This game has not started yet'));
        return false;
    }

    if (checkTurn && board.players[board.currentPlayerIndex].accountLogin !== player.accountLogin) {
        socket.emit('error', getErrorMessage(room, 'It is not your turn'));
        return false;
    }

    return true;
}

/**
 * Update the state of the game in a room for all players in the room.
 * @param socket A socket used to emit the update
 * @param room The room to update
 * @param global Whether to emit the update to all players in the room or only to the socket. Defaults to true.
 */
async function updateRoom(socket: AuthenticatedSocket, room: number, global = true) {
    const board = await boardRepo.findOne({
        where: {
            id: room,
        },
        cache: true,
    });

    // The game may have been deleted
    if (!board) {
        return;
    }

    if(global) {
        getIo().to(`game-${room}`).emit('update', board);
    } else {
        socket.emit('update', board);
    }
}