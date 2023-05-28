import { Board } from "../entity/Board";
import { GameStates as States } from "./GameStates";
import { GameTransitions as Transitions } from "./GameTransitions";
import { StateMachine } from "../state/StateMachine";
import { State } from "../state/State";
import { writeFileSync } from "fs";
import { AppDataSource } from "../data-source";
import { Player } from "../entity/Player";
import { getIo } from "../socket/IoGlobal";
import { BuyableSlotState } from "../entity/BuyableSlot";
import { BoardSlot } from "../entity/BoardSlot";
import { Message } from "../entity/Message";
import { TurnActions } from "./actions/TurnActions";
import { JailActions } from "./actions/JailActions";
import { LandActions } from "./actions/LandActions";
import { PlayerActions } from "./actions/PlayerActions";
import { PaymentActions } from "./actions/PaymentActions";

const boardRepo = AppDataSource.getRepository(Board);
const playerRepo = AppDataSource.getRepository(Player);
const slotsRepo = AppDataSource.getRepository(BoardSlot);
const messageRepo = AppDataSource.getRepository(Message);

/**
 * Represents a modification to a property.
 */
export interface PropertyEdit {
    /**
     * The position of the modified property.
     */
    position: number,

    /**
     * The new state of the property.
     */
    newState?: BuyableSlotState,

    /**
     * The new number of buildings on the property.
     */
    newNumberOfBuildings?: number,
}

/**
 * Represents a payment.
 */
export interface Payment {
    /**
     * The player making the payment.
     */
    receiver: Player | 'bank' | 'jackpot',

    /**
     * The amount being paid.
     */
    amount: number,

    /**
     * A callback to be called after the payment has been made. If undefined, the turn will end.
     * @param stateMachine The state machine for the game.
     * @param sender The player making the payment.
     * @param receiver The receiver of the payment.
     */
    callback?: (stateMachine: StateMachine<Transitions, States, GameEvent>, sender: Player, receiver: Player | 'bank' | 'jackpot', board: Board) => Promise<void>;
}

/**
 * Additional data to pass to each transition function.
 */
export interface GameEvent {
    /**
     * The board the game is being played on.
     */
    board: Board;

    /**
     * If a payment is being made, the details of the payment. Undefined otherwise.
     */
    payment?: Payment,

    /**
     * If modifications are being made to the properties of a player, the details of the modifications. Undefined otherwise.
     */
    propertiesEdit?: PropertyEdit[],
}

/**
 * Manage the state machines for each game.
 */
export class GameManager {
    /**
     * A map of all the games, with the game ID as the key.
     */
    games: Map<number, StateMachine<Transitions, States, GameEvent>>;

    constructor() {
        this.games = new Map<number, StateMachine<Transitions, States, GameEvent>>();
    }

    /**
     * Start a new state machine for a game.
     * @param board The board to start the game on.
     */
    startGame(board: Board) {
        this.games.set(board.id, GameManager.createMachine(board));
    }

    /**
     * Stop a game.
     * @param board The board the game was played on.
     * @param winner The winner of the game, or null if the game was aborted.
     */
    async stopGame(board: Board, winner: Player | null) {
        // Send the game over event
        getIo().to(`game-${board.id}`).emit("game-over", {
            gameId: board.id,
            winner: winner ? winner.accountLogin : null,
        });

        // Close the room
        getIo().in(`game-${board.id}`).socketsLeave(`game-${board.id}`);
        
        // Delete the game
        this.games.delete(board.id);
        
        const promises: Promise<any>[] = [];

        // Delete messages
        board.messages.forEach(message => {
            promises.push(messageRepo.remove(message));
        });
        await Promise.all(promises);

        await playerRepo.delete({ gameId: board.id });
        await slotsRepo.delete({ boardId: board.id });
        await boardRepo.remove(board);
    }

    /**
     * Get a state machine for a game.
     * @param game The game to get the state machine for.
     * @returns The state machine for the game.
     */
    getMachine(game: number | Board) {
        return this.games.get(typeof game === "number" ? game : game.id);
    }

    /**
     * Create a new state machine for a game.
     * @returns A new state machine for a game.
     */
    private static createMachine(board: Board, doNotEnterInitialState: boolean = false): StateMachine<Transitions, States, GameEvent> {
        // TODO: Finish this
        // Not yet implemented : manage double rolls
        return new StateMachine<Transitions, States, GameEvent>(States.START_TURN, [
            new State<Transitions, States, GameEvent>(
                States.START_TURN,
                [Transitions.END_TURN],
                {
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                    [Transitions.IS_NOT_IN_JAIL]: States.ROLL_DICE,
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                },
                [TurnActions.startOfTurn],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.TRY_ESCAPE_JAIL,
                [Transitions.IS_IN_JAIL],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.ESCAPE_WITH_DICE]: States.ESCAPE_WITH_DICE,
                    [Transitions.PAY_BAIL]: States.PAY_BAIL,
                    [Transitions.USE_OUT_OF_JAIL_CARD]: States.USE_OUT_OF_JAIL_CARD,
                },
                [JailActions.tryEscapeJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_BAIL,
                [Transitions.PAY_BAIL],
                {
                    [Transitions.PAY_BAIL]: States.PAY,
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                },
                [JailActions.handlePayBail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.USE_OUT_OF_JAIL_CARD,
                [Transitions.USE_OUT_OF_JAIL_CARD],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE,
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                },
                [JailActions.handleUseOutOfJailCard],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ESCAPE_WITH_DICE,
                [Transitions.ESCAPE_WITH_DICE],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE, // Success
                    [Transitions.END_TURN]: States.END_TURN, // Failure
                },
                [JailActions.handleEscapeWithDice],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ROLL_DICE,
                [Transitions.ROLL_DICE],
                {
                    [Transitions.MOVED_PLAYER]: States.LANDED_ON_SLOT,
                    [Transitions.PASS_START]: States.LANDED_ON_SLOT,
                },
                [TurnActions.handleRollDice],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.LANDED_ON_SLOT,
                [Transitions.MOVED_PLAYER],
                {
                    [Transitions.LAND_ON_BUYABLE]: States.BUYABLE_SLOT,
                    [Transitions.LAND_ON_FREE_PARKING]: States.FREE_PARKING,
                    [Transitions.LAND_ON_GO_TO_JAIL]: States.GO_TO_JAIL,
                    [Transitions.LAND_ON_TAX]: States.TAX,
                    [Transitions.LAND_ON_START]: States.GO,
                    [Transitions.LAND_ON_REST]: States.END_TURN,
                    [Transitions.LAND_ON_DRAW_CARD]: States.DRAW_CARD,
                },
                [LandActions.handleLanding],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO_TO_JAIL,
                [Transitions.LAND_ON_GO_TO_JAIL, Transitions.DREW_GO_TO_JAIL_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [LandActions.handleGoToJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUYABLE_SLOT,
                [Transitions.LAND_ON_BUYABLE],
                {
                    [Transitions.NOT_BOUGHT]: States.UNOWNED_SLOT,
                    [Transitions.BOUGHT]: States.OWNED_SLOT,
                },
                [LandActions.handleLandedOnBuyableSlot],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.UNOWNED_SLOT,
                [Transitions.NOT_BOUGHT],
                {
                    [Transitions.BUY_PROPERTY]: States.BUY_PROPERTY,
                    [Transitions.DO_NOT_BUY_PROPERTY]: States.END_TURN,
                },
                [LandActions.handleBuyingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUY_PROPERTY,
                [Transitions.BUY_PROPERTY],
                {
                    [Transitions.PAY_BANK]: States.PAY
                },
                [LandActions.handlePayingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.OWNED_SLOT,
                [Transitions.BOUGHT],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.OWNER_NOT_IN_JAIL]: States.PAY_RENT,
                },
                [LandActions.handleJailRentCheck],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_RENT,
                [Transitions.OWNER_NOT_IN_JAIL],
                {
                    [Transitions.PAY_PLAYER]: States.PAY,
                },
                [LandActions.handleRent],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.FREE_PARKING,
                [Transitions.LAND_ON_FREE_PARKING],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [LandActions.handleFreeParking],
                [],
            ),

            new State<Transitions, States, GameEvent>(
                States.TAX,
                [Transitions.LAND_ON_TAX],
                {
                    [Transitions.PAY_BANK]: States.PAY,
                },
                [LandActions.handlePayTax],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO,
                [Transitions.LAND_ON_START],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [LandActions.handleGo],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DRAW_CARD,
                [Transitions.LAND_ON_DRAW_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.DREW_GO_TO_JAIL_CARD]: States.GO_TO_JAIL,
                    [Transitions.MOVED_PLAYER]: States.LANDED_ON_SLOT,
                    [Transitions.PASS_START]: States.LANDED_ON_SLOT,
                    [Transitions.PAY_BANK]: States.PAY,
                },
                [LandActions.handleDrawCard],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.END_TURN,
                [Transitions.END_TURN, Transitions.DECLARE_BANKRUPTCY],
                {
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                    [Transitions.MANAGE_PROPERTIES]: States.MANAGE_PROPERTIES,
                    [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                    [Transitions.TRADE]: States.TRADE,
                },
                [TurnActions.handleEndTurn],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.NEXT_PLAYER,
                [Transitions.NEXT_PLAYER],
                {
                    [Transitions.NEXT_TURN]: States.START_TURN,
                    [Transitions.GAME_OVER]: States.END_GAME,
                },
                [TurnActions.handleNextPlayer],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DECLARE_BANKRUPTCY,
                [Transitions.DECLARE_BANKRUPTCY],
                {
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                },
                [PlayerActions.handleDeclareBankruptcy],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.MANAGE_PROPERTIES,
                [Transitions.MANAGE_PROPERTIES],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.PAY_BAIL]: States.PAY,
                    [Transitions.PAY_BANK]: States.PAY,
                    [Transitions.PAY_PLAYER]: States.PAY,
                },
                [PlayerActions.handleManageProperties],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.END_GAME,
                [Transitions.GAME_OVER],
                {},
                [TurnActions.handleGameOver],
                []
            ),

            new StateMachine<Transitions, States, GameEvent>(
                States.TRADE,
                [
                    new State<Transitions, States, GameEvent>(
                        States.TRADE,
                        [Transitions.TRADE],
                        {
                            [Transitions.ACCEPTED_TRADE]: States.TRADE_ACCEPTED,
                            [Transitions.END_TURN]: States.END_TURN,
                            [Transitions.CONTINUE]: States.PAY,
                        },
                        [PlayerActions.handleTrade],
                        []
                    ),

                    new State<Transitions, States, GameEvent>(
                        States.TRADE_ACCEPTED,
                        [Transitions.ACCEPTED_TRADE],
                        {
                            [Transitions.END_TURN]: States.END_TURN,
                            [Transitions.CONTINUE]: States.PAY,
                        },
                        [PlayerActions.handleTradeAccepted],
                        []
                    ),
                ],
                false,
                {
                    name: States.TRADE,
                    inTransitions: [
                        Transitions.TRADE,
                    ],
                    outTransitions: {
                        [Transitions.END_TURN]: States.END_TURN,
                        [Transitions.CONTINUE]: States.PAY,
                    }
                },
            ),

            new StateMachine<Transitions, States, GameEvent>(
                States.CHECK_IF_PLAYER_CAN_AFFORD,
                [
                    new State<Transitions, States, GameEvent>(
                        States.PLAYER_IN_DEBT,
                        [Transitions.CANNOT_PAY],
                        {
                            [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                            [Transitions.TRADE]: States.TRADE,
                            [Transitions.MANAGE_PROPERTIES]: States.MANAGE_PROPERTIES,
                            [Transitions.CAN_PAY]: States.CHECK_IF_PLAYER_CAN_AFFORD,
                        },
                        [PaymentActions.handlePlayerInDebt],
                        []
                    ),
                    
                    new State<Transitions, States, GameEvent>(
                        States.CHECK_IF_PLAYER_CAN_AFFORD,
                        [
                            Transitions.PAY_BAIL,
                            Transitions.PAY_BANK,
                            Transitions.PAY_PLAYER,
                        ],
                        {
                            [Transitions.CAN_PAY]: States.TRANSFER_MONEY,
                            [Transitions.CANNOT_PAY]: States.PLAYER_IN_DEBT,
                        },
                        [PaymentActions.handleCheckIfPlayerCanAfford],
                        []
                    ),

                    new State<Transitions, States, GameEvent>(
                        States.TRANSFER_MONEY,
                        [Transitions.CAN_PAY],
                        {
                            [Transitions.END_TURN]: States.END_TURN,
                        },
                        [PaymentActions.handleTransferMoney],
                        []
                    ),
                ],
                false,
                {
                    name: States.PAY,
                    outTransitions: {
                        [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                        [Transitions.END_TURN]: States.END_TURN,
                        [Transitions.PAY_BAIL]: States.ROLL_DICE,
                        [Transitions.ROLL_DICE]: States.ROLL_DICE,
                        [Transitions.IS_NOT_IN_JAIL]: States.ROLL_DICE,
                    },
                    inTransitions: [
                        Transitions.PAY_BAIL,
                        Transitions.PAY_BANK,
                        Transitions.PAY_PLAYER,
                    ]
                }
            ),
        ], false, undefined, { board }, doNotEnterInitialState, validateAdditionalData);
    }

    /**
     * Dump a graph of the state machine to a file.
     * @param filename The filename to write the graph to.
     */
    static dumpMachineGraph(filename: string) {
        writeFileSync(filename, this.createMachine(null, true).generateDot());
    }
}

/**
 * Validate the additional data for the game.
 * @param data The data to validate.
 * @returns An error message if the data is invalid, otherwise an empty string.
 */
function validateAdditionalData(data: GameEvent): string {
    if(!data.board) {
        return 'Board is required';
    }

    return '';
}

/**
 * The game manager.
 */
export const Manager = new GameManager();