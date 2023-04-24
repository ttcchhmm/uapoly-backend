import { Board } from "../entity/Board";
import { GameStates as States } from "../enums/GameStates";
import { GameTransitions as Transitions } from "../enums/GameTransitions";
import { StateMachine } from "../state/StateMachine";
import { State } from "../state/State";
import { writeFileSync } from "fs";

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
        // Not yet implemented : manage double rolls, payments
        return new StateMachine<Transitions, States, GameEvent>(States.START_TURN, [
            new State<Transitions, States, GameEvent>(
                States.START_TURN,
                [Transitions.END_TURN],
                {
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                    [Transitions.IS_NOT_IN_JAIL]: States.ROLL_DICE,
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
                    [Transitions.ROLL_DICE]: States.ROLL_DICE,
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
                {}, // TODO Handle payment
                [],
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
                {}, // TODO: Handle payment
                [],
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
                {}, // TODO: Handle payment
                [],
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

            new State<Transitions, States, GameEvent>(
                States.TRADE,
                [Transitions.TRADE],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleTrade],
                []
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
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function startOfTurn(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "try escape jail" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function tryEscapeJail(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLanding(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function endTurn(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on buyable slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLandedOnBuyableSlot(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "buy property" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleBuyingProperty(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on bought slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleJailRentCheck(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "Free Parking" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleFreeParking(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on Go" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleGo(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}
/**
 * Function executed each time the "landed on Draw Card" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleDrawCard(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "Go To Jail" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleGoToJail(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleEndTurn(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "next player" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleNextPlayer(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "declare bankruptcy" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleDeclareBankruptcy(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "manage properties" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleManageProperties(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "trade" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleTrade(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay bail" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayBail(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "use out of jail card" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleUseOutOfJailCard(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "try escape with dice" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleEscapeWithDice(machine: StateMachine<Transitions, States, GameEvent>, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * The game manager.
 */
export const Manager = new GameManager();