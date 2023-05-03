import { Server } from "socket.io";

/**
 * The socket.io server.
 */
let io: Server;

/**
 * Set the socket.io server.
 * @param server The new socket.io server
 */
export function setIo(server: Server) {
    io = server;
}

/**
 * Get the socket.io server.
 * @returns The socket.io server
 */
export function getIo() {
    return io;
}