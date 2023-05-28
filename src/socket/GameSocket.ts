import { AuthenticatedSocket } from "../auth/AuthenticatedSocket";
import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { BoardSlot } from "../entity/BoardSlot";
import { BuyableSlotTrade } from "../entity/BuyableSlotTrade";
import { Message } from "../entity/Message";
import { MoneyTrade } from "../entity/MoneyTrade";
import { Player } from "../entity/Player";
import { TradeItem } from "../entity/TradeItem";
import { TradeOffer } from "../entity/TradeOffer";
import { Manager, PropertyEdit } from "../game/GameManager";
import { GameTransitions } from "../game/GameTransitions";
import { PendingPayments } from "../game/actions/PaymentActions";
import { checkBody } from "../utils/CheckBody";
import { MeansOfEscape } from "./Events";
import { getIo } from "./IoGlobal";

const playerRepo = AppDataSource.getRepository(Player);
const boardRepo = AppDataSource.getRepository(Board);
const messageRepo = AppDataSource.getRepository(Message);
const tradeOfferRepo = AppDataSource.getRepository(TradeOffer);
const tradeItemRepo = AppDataSource.getRepository(TradeItem);
const slotsRepo = AppDataSource.getRepository(BoardSlot);

/**
 * Function called when a socket connects, after authentication.
 * @param socket The socket that connected
 */
export function onConnect(socket: AuthenticatedSocket) {
    // Set up the socket events
    socket.on('disconnect', onDisconnect(socket));
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
    socket.on('acceptTrade', onAcceptTrade(socket));
    socket.on('rollDices', onRollDices(socket));
    socket.on('escapeJail', onEscapeJail(socket));
    socket.on('retryPayement', onRetryPayement(socket));

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

function onDisconnect(socket: AuthenticatedSocket) {
    return () => {
        socket.rooms.forEach(room => {
            const split = room.split('-');
            socket.leave(`game-${split[1]}`);
            socket.to(room).emit('player-disconnected', {gameId: parseInt(split[1]), player: socket.user.login});
        });
    }
}

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

        if(socket.rooms.has(`game-${room}`)) {
            socket.emit('error', getErrorMessage(room, 'You already joined this game'));
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

        getIo().to(`game-${room}`).emit('player-connected', {gameId: room, accountLogin: player.accountLogin});
        await socket.join(`game-${room}`);
        socket.emit('joined', player.game);

        await updateRoom(socket, room);
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

            await updateRoom(socket, room);
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
    return async (data: { gameId: number, properties: PropertyEdit[] }) => {
        if(isNaN(data.gameId)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid game ID'));
            return;
        } else if(!Array.isArray(data.properties)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid properties'));
            return;
        }

        const [player, board] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.gameId,
                },
                relations: ['players'],
                cache: true,
            }),
        ]);

        for(const p of data.properties) {
            if(isNaN(p.position)) {
                socket.emit('error', getErrorMessage(data.gameId, 'Invalid properties'));
                return;
            } else if(!(await player.ownedProperties).find(op => op.position === p.position)) {
                socket.emit('error', getErrorMessage(data.gameId, `You do not own this property: ${p.position}`));
                return;
            }
        }

        if(checkBoardAndPlayerValidity(board, player, socket, data.gameId)) {
            const payment = PendingPayments.get(data.gameId);
            PendingPayments.delete(data.gameId);

            Manager.games.get(data.gameId).transition(GameTransitions.MANAGE_PROPERTIES, { board: board, propertiesEdit: data.properties, payment });
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
    return async(data: { gameId: number, message: string, recipient: string | undefined }) => {
        if(isNaN(data.gameId)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid game ID'));
            return;
        } else if(typeof data.message !== 'string' || (data.message.trim()).length === 0) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid message'));
            return;
        }

        data.message = data.message.trim();

        // Get the player and the board
        const promises = [
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.gameId,
                },
                relations: ['players'],
                cache: true,
            }),
        ];

        // Get the recipient if it exists
        if(data.recipient && typeof data.recipient === 'string') {
            promises.push(playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: data.recipient,
                },
                cache: true,
            }));
        }

        const [player, board, recipient] = await Promise.all(promises);

        // If a recipient was specified, check if it exists within the game
        if(data.recipient && !recipient) {
            socket.emit('error', getErrorMessage(data.gameId, `This player does not exist: ${data.recipient}`));
            return;
        }

        if(checkBoardAndPlayerValidity(board as Board, player as Player, socket, data.gameId, false, false)) {
            const msg = new Message(board as Board, data.message, player as Player, recipient as Player);
            (board as Board).messages.push(msg);

            await Promise.all([
                boardRepo.save(board as Board),
                messageRepo.save(msg),
            ]);

            getIo().to(`game-${data.gameId}`).emit('message', {
                unsafe: true, // TODO: Update this when the private message functionality is actually private
                content: msg.content,
                sender: msg.sender.accountLogin,
                recipient: msg.recipient ? msg.recipient.accountLogin : undefined,
                id: msg.id,
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
    return async (data: { gameId: number, propertiesOffered: number[], moneyOffered: number, propertiesRequested: number[], moneyRequested: number, recipient: string, message: string | undefined }) => {
        // Sanity checks
        if(!checkBody(data, 'gameId', 'propertiesOffered', 'moneyOffered', 'propertiesRequested', 'moneyRequested', 'recipient')) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid properties'));
            return;
        }

        if(isNaN(data.gameId)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid game ID'));
            return;
        }

        if(data.moneyOffered <= 0 || data.moneyRequested <= 0) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid money'));
            return;
        }

        // Get the player, board and recipient
        const [player, board, recipient] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.gameId,
                },
                relations: ['players'],
                cache: true,
            }),
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: data.recipient,
                },
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, data.gameId, false)) {
            // Fetch the properties
            const offered: TradeItem[] = [];
            const requested: TradeItem[] = [];

            for(const id of data.propertiesOffered) {
                const property = (await player.ownedProperties).find((p) => p.position === id);

                if(!property) {
                    socket.emit('error', getErrorMessage(data.gameId, `Invalid property: ${id}`));
                    return;
                }

                offered.push(new BuyableSlotTrade(property));
            }

            for(const id of data.propertiesRequested) {
                const property = (await recipient.ownedProperties).find((p) => p.position === id);

                if(!property) {
                    socket.emit('error', getErrorMessage(data.gameId, `Invalid property: ${id}`));
                    return;
                }

                requested.push(new BuyableSlotTrade(property));
            }

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
            getIo().to(`game-${data.gameId}`).emit('message', {
                unsafe: true, // TODO: Update this when the private message functionality is actually private
                content: msg.content,
                sender: msg.sender.accountLogin,
                recipient: msg.recipient ? msg.recipient.accountLogin : undefined,
                id: msg.id,
                // TODO: Send the trade offer
            });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'acceptTrade' event, to accept a trade offer.
 * @param socket The socket to bind to
 * @returns A function that will be called when the socket emits a 'acceptTrade' event
 */
function onAcceptTrade(socket: AuthenticatedSocket) {
    return async (data: { gameId: number, message: number }) => {
        if(!checkBody(data, 'gameId', 'message')) {
            socket.emit('error', getErrorMessage(data.gameId, 'Missing parameters'));
            return;
        }

        if(isNaN(data.gameId) || isNaN(data.message)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid parameters'));
            return;
        }

        const [player, board, message] = await Promise.all([
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
            boardRepo.findOne({
                where: {
                    id: data.gameId,
                },
                relations: ['players'],
                cache: true,
            }),
            messageRepo.findOne({
                where: {
                    id: data.message,
                },
                relations: ['tradeOffer', 'sender', 'recipient'],
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, data.gameId, false)) {
            if(!message) {
                socket.emit('error', getErrorMessage(data.gameId, 'Invalid message ID'));
                return;
            } else if(!message.tradeOffer) {
                socket.emit('error', getErrorMessage(data.gameId, 'This message does not contain a trade offer'));
                return;
            }

            // Check if the player is the recipient
            if(message.recipient.accountLogin !== player.accountLogin) {
                socket.emit('error', getErrorMessage(data.gameId, 'You are not the recipient of this trade'));
                return;
            }

            // Check if both parties have enough money
            const totalOfferedMoney = message.tradeOffer.offered.reduce((prev, curr) => {
                if(curr instanceof MoneyTrade) {
                    return prev + curr.moneyAmount;
                } else {
                    return prev;
                }
            }, 0);

            if(totalOfferedMoney > message.sender.money) {
                socket.emit('error', getErrorMessage(data.gameId, 'The sender does not have enough money'));
                return;
            }

            const totalRequestedMoney = message.tradeOffer.requested.reduce((prev, curr) => {
                if(curr instanceof MoneyTrade) {
                    return prev + curr.moneyAmount;
                } else {
                    return prev;
                }
            }, 0);

            if(totalRequestedMoney > player.money) {
                socket.emit('error', getErrorMessage(data.gameId, 'You do not have enough money'));
                return;
            }

            // Check if both parties have all the properties
            if(message.tradeOffer.offered.reduce((prev, curr) => {
                if(curr instanceof BuyableSlotTrade && curr.buyableSlot.owner.accountLogin !== message.sender.accountLogin) {
                    return true;
                } else {
                    return prev;
                }
            }, false)) {
                socket.emit('error', getErrorMessage(data.gameId, 'The sender does not own all the properties'));
                return;
            }

            if(message.tradeOffer.requested.reduce((prev, curr) => {
                if(curr instanceof BuyableSlotTrade && curr.buyableSlot.owner.accountLogin !== player.accountLogin) {
                    return true;
                } else {
                    return prev;
                }
            }, false)) {
                socket.emit('error', getErrorMessage(data.gameId, 'You do not own all the properties'));
                return;
            }

            // Perform the trade
            let promises: Promise<any>[] = message.tradeOffer.offered.map((item) => {
                if(item instanceof MoneyTrade) {
                    message.sender.money -= item.moneyAmount;
                    return playerRepo.save(message.sender);
                } else if(item instanceof BuyableSlotTrade) {
                    item.buyableSlot.owner = player;
                    return slotsRepo.save(item.buyableSlot);
                } else {
                    return Promise.resolve(); // Should never happen, but makes the compiler happy
                }
            });

            promises = promises.concat(message.tradeOffer.requested.map((item) => {
                if(item instanceof MoneyTrade) {
                    player.money -= item.moneyAmount;
                    return playerRepo.save(player);
                } else if(item instanceof BuyableSlotTrade) {
                    item.buyableSlot.owner = message.sender;
                    return slotsRepo.save(item.buyableSlot);
                } else {
                    return Promise.resolve(); // Should never happen, but makes the compiler happy
                }
            }));

            await Promise.all(promises);

            // Notify the clients
            getIo().to(`game-${data.gameId}`).emit('tradeSucceeded', {
                gameId: data.gameId,
                sender: message.sender.accountLogin,
                recipient: player.accountLogin,
            });

            await updateRoom(socket, data.gameId);
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'declineTrade' event, to decline a trade offer.
 * @param socket The socket to bind to.
 * @returns A function that will be called when the socket emits a 'rollDices' event.
 */
function onRollDices(socket: AuthenticatedSocket) {
    return async (gameId: number) => {
        if(isNaN(gameId)) {
            socket.emit('error', getErrorMessage(gameId, 'Invalid parameters'));
            return;
        }

        const [board, player] = await Promise.all([
            boardRepo.findOne({
                where: {
                    id: gameId,
                },
                relations: ['players'],
                cache: true,
            }),
            playerRepo.findOne({
                where: {
                    gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, gameId)) {
            Manager.getMachine(gameId).transition(GameTransitions.IS_NOT_IN_JAIL, { board });
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'escapeJail' event, to escape jail.
 * @param socket The socket to bind to.
 * @returns A function that will be called when the socket emits a 'escapeJail' event.
 */
function onEscapeJail(socket: AuthenticatedSocket) {
    return async (data: { gameId: number, meanOfEscape: MeansOfEscape }) => {
        if(isNaN(data.gameId)) {
            socket.emit('error', getErrorMessage(data.gameId, 'Invalid parameters'));
            return;
        }

        const [board, player] = await Promise.all([
            boardRepo.findOne({
                where: {
                    id: data.gameId,
                },
                relations: ['players'],
                cache: true,
            }),
            playerRepo.findOne({
                where: {
                    gameId: data.gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, data.gameId)) {
            const machine = Manager.getMachine(data.gameId);

            switch(data.meanOfEscape) {
                case MeansOfEscape.PAY:
                    machine.transition(GameTransitions.PAY_BAIL, { board });
                    break;

                case MeansOfEscape.USE_CARD:
                    machine.transition(GameTransitions.USE_OUT_OF_JAIL_CARD, { board });
                    break;

                case MeansOfEscape.ROLL:
                    machine.transition(GameTransitions.ESCAPE_WITH_DICE, { board });
                    break;

                default:
                    socket.emit('error', getErrorMessage(data.gameId, 'Invalid parameters'));
                    break;
            }
        }
    }
}

/**
 * Get a function that will be called when the socket emits a 'retryPayement' event, to retry a payement.
 * @param socket The socket to bind to.
 * @returns A function that will be called when the socket emits a 'retryPayement' event.
 */
function onRetryPayement(socket: AuthenticatedSocket) {
    return async (gameId: number) => {
        if(isNaN(gameId)) {
            socket.emit('error', getErrorMessage(gameId, 'Invalid parameters'));
            return;
        }

        const [board, player] = await Promise.all([
            boardRepo.findOne({
                where: {
                    id: gameId,
                },
                relations: ['players'],
                cache: true,
            }),
            playerRepo.findOne({
                where: {
                    gameId,
                    accountLogin: socket.user.login,
                },
                cache: true,
            }),
        ]);

        if(checkBoardAndPlayerValidity(board, player, socket, gameId)) {
            const payment = PendingPayments.get(gameId);
            PendingPayments.delete(gameId);

            Manager.getMachine(gameId).transition(GameTransitions.CAN_PAY, { board, payment });
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
function checkBoardAndPlayerValidity(board: Board, player: Player, socket: AuthenticatedSocket, room: number, checkTurn = true, checkStarted = true) {
    if (!player) {
        socket.emit('error', getErrorMessage(room, 'You are not in this game'));
        return false;
    }

    if (!board) {
        socket.emit('error', getErrorMessage(room, 'This game does not exist'));
        return false;
    }

    if (checkStarted && !board.started) {
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
    if(isNaN(room)) {
        return;
    }

    const board = await boardRepo.findOne({
        where: {
            id: room,
        },
        relations: ['players'],
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