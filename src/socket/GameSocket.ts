import { AuthenticatedSocket } from "../auth/AuthenticatedSocket";
import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { Player } from "../entity/Player";
import { Manager } from "./GameManager";
import { getIo } from "./IoGlobal";

const playerRepo = AppDataSource.getRepository(Player);
const boardRepo = AppDataSource.getRepository(Board);

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
        await updateRoom(socket, room, false);
    }
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
