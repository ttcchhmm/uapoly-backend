import { Socket } from "socket.io";
import { Token } from "./Token";

/**
 * A socket.io socket with an authenticated user.
 */
export interface AuthenticatedSocket extends Socket {
    /**
     * The authenticated user.
     */
    user: Token;
}