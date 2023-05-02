import { Board } from "../entity/Board";
import { GameStates as States } from "../enums/GameStates";
import { GameTransitions as Transitions } from "../enums/GameTransitions";
import { StateMachine } from "../state/StateMachine";
import { State } from "../state/State";
import { writeFileSync } from "fs";
import { AppDataSource } from "../data-source";
import { Player } from "../entity/Player";

const boardRepo = AppDataSource.getRepository(Board);
const playerRepo = AppDataSource.getRepository(Player);

/**
 * Additional data to pass to each transition function.
 */
interface GameEvent {
    /**
     * The board the game is being played on.
     */
    board: Board;
}

/**
 * Manage the state machines for each game.
 */
export class GameManager {
    /**
     * A map of all the games, with the game ID as the key.
     */
    games: Map<number, StateMachine<Transitions, States, GameEvent>>;

    /**
     * Start a new state machine for a game.
     * @param board The board to start the game on.
     */
    startGame(board: Board) {
        this.games.set(board.id, GameManager.createMachine());
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
    private static createMachine(): StateMachine<Transitions, States, GameEvent> {
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
                [startOfTurn],
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
                [tryEscapeJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_BAIL,
                [Transitions.PAY_BAIL],
                {
                    [Transitions.PAY_BAIL]: States.PAY,
                },
                [handlePayBail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.USE_OUT_OF_JAIL_CARD,
                [Transitions.USE_OUT_OF_JAIL_CARD],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE,
                },
                [handleUseOutOfJailCard],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ESCAPE_WITH_DICE,
                [Transitions.ESCAPE_WITH_DICE],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE, // Success
                    [Transitions.END_TURN]: States.END_TURN, // Failure
                },
                [handleEscapeWithDice],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ROLL_DICE,
                [Transitions.ROLL_DICE],
                {
                    [Transitions.MOVED_PLAYER]: States.LANDED_ON_SLOT,
                    [Transitions.PASS_START]: States.LANDED_ON_SLOT,
                },
                [],
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
                [handleLanding],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO_TO_JAIL,
                [Transitions.LAND_ON_GO_TO_JAIL, Transitions.DREW_GO_TO_JAIL_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleGoToJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUYABLE_SLOT,
                [Transitions.LAND_ON_BUYABLE],
                {
                    [Transitions.NOT_BOUGHT]: States.UNOWNED_SLOT,
                    [Transitions.BOUGHT]: States.OWNED_SLOT,
                },
                [handleLandedOnBuyableSlot],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.UNOWNED_SLOT,
                [Transitions.NOT_BOUGHT],
                {
                    [Transitions.BUY_PROPERTY]: States.BUY_PROPERTY,
                    [Transitions.DO_NOT_BUY_PROPERTY]: States.END_TURN,
                },
                [handleBuyingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUY_PROPERTY,
                [Transitions.BUY_PROPERTY],
                {
                    [Transitions.PAY_BANK]: States.PAY
                },
                [handlePayingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.OWNED_SLOT,
                [Transitions.BOUGHT],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.OWNER_NOT_IN_JAIL]: States.PAY_RENT,
                },
                [handleJailRentCheck],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_RENT,
                [Transitions.OWNER_NOT_IN_JAIL],
                {
                    [Transitions.PAY_PLAYER]: States.PAY,
                },
                [handleRent],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.FREE_PARKING,
                [Transitions.LAND_ON_FREE_PARKING],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleFreeParking],
                [],
            ),

            new State<Transitions, States, GameEvent>(
                States.TAX,
                [Transitions.LAND_ON_TAX],
                {
                    [Transitions.PAY_BANK]: States.PAY,
                },
                [handlePayTax],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO,
                [Transitions.LAND_ON_START],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleGo],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DRAW_CARD,
                [Transitions.LAND_ON_DRAW_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.DREW_GO_TO_JAIL_CARD]: States.GO_TO_JAIL,
                },
                [handleDrawCard],
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
                [handleEndTurn],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.NEXT_PLAYER,
                [Transitions.NEXT_PLAYER],
                {
                    [Transitions.NEXT_TURN]: States.START_TURN,
                    [Transitions.GAME_OVER]: States.END_GAME,
                },
                [handleNextPlayer],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DECLARE_BANKRUPTCY,
                [Transitions.DECLARE_BANKRUPTCY],
                {
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                },
                [handleDeclareBankruptcy],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.MANAGE_PROPERTIES,
                [Transitions.MANAGE_PROPERTIES],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleManageProperties],
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
                        [handleTrade],
                        []
                    ),

                    new State<Transitions, States, GameEvent>(
                        States.TRADE_ACCEPTED,
                        [Transitions.ACCEPTED_TRADE],
                        {
                            [Transitions.END_TURN]: States.END_TURN,
                            [Transitions.CONTINUE]: States.PAY,
                        },
                        [handleTradeAccepted],
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
                            [Transitions.CAN_PAY]: States.TRANSFER_MONEY,
                        },
                        [handlePlayerInDebt],
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
                        [handleCheckIfPlayerCanAfford],
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
                    },
                    inTransitions: [
                        Transitions.PAY_BAIL,
                        Transitions.PAY_BANK,
                        Transitions.PAY_PLAYER,
                    ]
                }
            ),
        ], false);
    }

    /**
     * Dump a graph of the state machine to a file.
     * @param filename The filename to write the graph to.
     */
    static dumpMachineGraph(filename: string) {
        writeFileSync(filename, this.createMachine().generateDot());
    }
}

/**
 * Function executed each time the "start of turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function startOfTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

    if(player.money <= 0) {
        currentMachine.transition(Transitions.NEXT_PLAYER, additionalData);
    } else if(player.inJail) {
        currentMachine.transition(Transitions.IS_IN_JAIL, additionalData);
    } else {
        currentMachine.transition(Transitions.IS_NOT_IN_JAIL, additionalData);
    }
}

/**
 * Function executed each time the "try escape jail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function tryEscapeJail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLanding(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function endTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on buyable slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLandedOnBuyableSlot(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "buy property" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleBuyingProperty(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on bought slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleJailRentCheck(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "Free Parking" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleFreeParking(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on Go" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleGo(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}
/**
 * Function executed each time the "landed on Draw Card" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleDrawCard(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "Go To Jail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleGoToJail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    player.inJail = true;
    player.currentSlotIndex = additionalData.board.jailSlotIndex;
    await playerRepo.save(player);

    currentMachine.transition(Transitions.END_TURN, additionalData);
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleEndTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "next player" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleNextPlayer(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    if(additionalData.board.currentPlayerIndex + 1 >= additionalData.board.players.length) {
        additionalData.board.currentPlayerIndex = 0;
    } else {
        additionalData.board.currentPlayerIndex++;
    }

    await boardRepo.save(additionalData.board);
    
    if(additionalData.board.players.reduce((acc, player) => acc && player.money > 0, true)) {
        currentMachine.transition(Transitions.NEXT_TURN, additionalData);
    } else {
        currentMachine.transition(Transitions.GAME_OVER, additionalData);
    }
}

/**
 * Function executed each time the "declare bankruptcy" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleDeclareBankruptcy(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "manage properties" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleManageProperties(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "trade" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleTrade(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay bail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayBail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "use out of jail card" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleUseOutOfJailCard(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "try escape with dice" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleEscapeWithDice(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "player is in debt" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePlayerInDebt(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay property" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayingProperty(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay rent" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleRent(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay tax" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayTax(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "check if player can afford" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleCheckIfPlayerCanAfford(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "trade accepted state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleTradeAccepted(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * The game manager.
 */
export const Manager = new GameManager();