import { Board } from "../entity/Board";
import { Message } from "../entity/Message";
import { PropertyEdit } from "../game/GameManager";

/**
 * Represent a message.
 */
interface MessageEvent {
    /**
     * True if the message is unsafe. An unsafe message is a message that has been sent to every client, regardless of the recipient.
     */
    unsafe: boolean;

    /**
     * The content of the message.
     */
    content: string,

    /**
     * The sender of the message.
     */
    sender: string,

    /**
     * The recipient of the message. Null if the message is public.
     */
    recipient: string | null,

    /**
     * The ID of the message.
     */
    id: number,
}

/**
 * Represent ways to escape jail.
 */
export enum MeansOfEscape {
    /**
     * The player paid to escape jail.
     */
    PAY = 'PAY',

    /**
     * The player used a card to escape jail.
     */
    USE_CARD = 'USE_CARD',

    /**
     * The player rolled the dices to escape jail.
     */
    ROLL = 'ROLL',
}

/**
 * Events that can be emitted by the server.
 */
export interface ServerEvents {
    /**
     * The connection has been recovered between the client and the server.
     */
    recovered: () => void;

    /**
     * A new player joined the game.
     * @param data The payload of the event.
     */
    'player-connected': (data: { gameId: number, accountLogin: string }) => void;

    /**
     * A player left the game.
     * @param data The payload of the event.
     */
    'player-disconnected': (data: { gameId: number, accountLogin: string }) => void;

    /**
     * The client has successfully joined the game.
     * @param board The board the game is being played on.
     */
    joined: (board: Board) => void;

    /**
     * The client has successfully left the game.
     * @param gameId The game ID that the client left.
     */
    left: (gameId: number) => void;

    /**
     * An updated state of the game has been sent by the server.
     * @param board The board the game is being played on.
     */
    update: (board: Board) => void;

    /**
     * The game is over.
     * @param data The payload of the event.
     */
    'game-over': (data: { gameId: number, winner: string }) => void;

    /**
     * A player is currently in jail and should act to try to escape.
     * @param data The payload of the event.
     */
    tryEscapeJail: (data: { gameId: number, accountLogin: string }) => void;

    /**
     * A player rolled the dice.
     * @param data The payload of the event.
     */
    diceRoll: (data: { gameId: number, accountLogin: string, dices: number[] }) => void;

    /**
     * A player went bankrupt.
     * @param data The payload of the event.
     */
    bankrupt: (data: { gameId: number, accountLogin: string, quitted: boolean }) => void;

    /**
     * A player's turn has started.
     * @param data The payload of the event.
     */
    startOfTurn: (data: { gameId: number, accountLogin: string }) => void;

    /**
     * A player drew a card.
     * @param data The payload of the event.
     */
    cardDrawn: (data: { gameId: number, accountLogin: string, description: string }) => void;

    /**
     * A player bought a property.
     * @param data The payload of the event.
     */
    propertyBought: (data: { gameId: number, accountLogin: string, slotIndex: number, price: number }) => void;

    /**
     * A player is in debt.
     * @param data The payload of the event.
     */
    playerInDebt: (data: { gameId: number, accountLogin: string, amount: number }) => void;

    /**
     * A player successfully paid a debt.
     * @param data The payload of the event.
     */
    paymentSucceeded: (data: { gameId: number, sender: string, receiver: string, amount: number }) => void;

    /**
     * The player landed on an unowned property.
     * @param data The payload of the event.
     */
    landedOnUnowned: (data: { gameId: number, accountLogin: string, position: number, price: number }) => void;

    /**
     * A message has been sent.
     * @param message The message to send.
     */
    message: (message: MessageEvent) => void;

    /**
     * A player accepted a trade.
     * @param data The payload of the event.
     */
    tradeSucceeded: (data: { gameId: number, sender: string, recipient: string }) => void;

    /**
     * A player's turn has ended.
     * @param data The payload of the event.
     */
    endOfTurn: (data: { gameId: number, accountLogin: string }) => void;

    /**
     * A player must pay a tax.
     * @param data The payload of the event.
     */
    tax: (data: { gameId: number, accountLogin: string, amount: number }) => void;

    /**
     * A player should roll the dices.
     * @param data The payload of the event.
     */
    shouldRollDices: (data: { gameId: number, accountLogin: string }) => void;
}

/**
 * Events that can be emitted by the client.
 */
export interface ClientEvents {
    /**
     * Listen for events for a game.
     * @param room The game ID to join.
     */
    join: (room: number) => void;

    /**
     * Stop listening for events for a game.
     * @param room The game ID to join.
     */
    leave: (room: number) => void;

    /**
     * Start a game. Only the game master can start a game.
     * @param room The game ID to start.
     */
    start: (room: number) => void;

    /**
     * Request an updated state of the game.
     * @param room The game ID to request.
     */
    update: (room: number) => void;

    /**
     * Declare bankruptcy.
     * @param room The game ID to process.
     */
    declareBankruptcy: (room: number) => void;

    /**
     * End the current player's turn.
     * @param room The game ID to process.
     */
    nextPlayer: (room: number) => void;

    /**
     * Manage the current player's properties.
     * @param data The payload of the event.
     */
    manageProperties: (data: { room: number, properties: PropertyEdit[] }) => void;

    /**
     * Do not buy the property the current player landed on.
     * @param room The game ID to process.
     */
    doNotBuy: (room: number) => void;

    /**
     * Buy the property the current player landed on.
     * @param room The game ID to process.
     */
    buy: (room: number) => void;

    /**
     * A client sent a message.
     * @param data The payload of the event.
     */
    message: (data: { room: number, message: string, recipient: string | undefined }) => void;

    /**
     * Start a trade with another player.
     * @param data The payload of the event.
     */
    trade: (data: { room: number, recipient: string, propertiesOffered: number[], moneyOffered: number, propertiesRequested: number[], moneyRequested: number, message: string | undefined }) => void;

    /**
     * Accept a trade.
     * @param data The payload of the event.
     */
    acceptTrade: (data: { room: number, message: number }) => void;

    /**
     * Make the player roll the dices.
     * @param room The game ID to process.
     */
    rollDices: (room: number) => void;

    /**
     * The player is in jail and should try to escape.
     * @param data The payload of the event.
     */
    escapeJail: (data: { room: number, meanOfEscape: MeansOfEscape }) => void;

    /**
     * The player is retrying to pay a debt.
     * @param room The game ID to process.
     */
    retryPayement(room: number): void;
}