import { AuthenticatedSocket } from "../auth/AuthenticatedSocket";

/**
 * Function called when a socket connects, after authentication.
 * @param socket The socket that connected
 */
export function onConnect(socket: AuthenticatedSocket) {
    console.log(`"${socket.user.login}" connected through socket ${socket.id}`);
}