import { Player } from "./Player";

export class Message {
    /**
     * The ID of the message.
     */
    id: number;

    content: string;

    recipient: Player | null;
}