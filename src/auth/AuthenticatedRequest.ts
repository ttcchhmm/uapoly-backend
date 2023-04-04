import { Token } from "./Token";
import { Request } from "express";

/**
 * An Express request with an authenticated user.
 */
export interface AuthenticatedRequest extends Request {
    /**
     * The authenticated user.
     */
    user: Token,
}