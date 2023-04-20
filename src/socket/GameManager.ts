import { Board } from "../entity/Board";
import { GameStates as States } from "../enums/GameStates";
import { GameTransitions as Transitions } from "../enums/GameTransitions";
import { StateMachine } from "../state/StateMachine";
import { State } from "../state/State";

/**
 * Manage the state machines for each game.
 */
class GameManager {
    /**
     * A map of all the games, with the game ID as the key.
     */
    games: Map<number, StateMachine<Transitions, States>>;

    /**
     * Start a new state machine for a game.
     * @param board The board to start the game on.
     */
    startGame(board: Board) {
        // TODO: Finish this
        const machine = new StateMachine<Transitions, States>(States.START_TURN, [
            new State<Transitions, States>(
                States.START_TURN,
                [Transitions.END_TURN],
                {
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                    [Transitions.IS_NOT_IN_JAIL]: States.ROLL_DICE,
                },
                [startOfTurn],
                []
            ),

            new State<Transitions, States>(
                States.TRY_ESCAPE_JAIL,
                [Transitions.IS_IN_JAIL],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.ROLL_DICE]: States.ROLL_DICE, // TODO: Maybe this should be a different state?
                },
                [tryEscapeJail],
                []
            ),

            new State<Transitions, States>(
                States.ROLL_DICE,
                [Transitions.ROLL_DICE],
                {
                    [Transitions.MOVED_PLAYER]: States.MOVE_PLAYER, // TODO: Handle passing GO
                },
                [],
                []
            ),

            new State<Transitions, States>(
                States.LANDED_ON_SLOT,
                [Transitions.MOVED_PLAYER],
                {
                    [Transitions.LAND_ON_BUYABLE]: States.BUYABLE_SLOT,
                    [Transitions.LAND_ON_FREE_PARKING]: States.FREE_PARKING,
                    [Transitions.LAND_ON_GO_TO_JAIL]: States.GO_TO_JAIL,
                    [Transitions.LAND_ON_TAX]: States.TAX,
                    [Transitions.LAND_ON_START]: States.GO,
                    [Transitions.LAND_ON_REST]: States.END_TURN,
                },
                [handleLanding],
                []
            ),

            new State<Transitions, States>(
                States.GO_TO_JAIL,
                [Transitions.LAND_ON_GO_TO_JAIL, Transitions.DREW_GO_TO_JAIL_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [endTurn],
                []
            ),

            new State<Transitions, States>(
                States.BUYABLE_SLOT,
                [Transitions.LAND_ON_BUYABLE],
                {
                    [Transitions.NOT_BOUGHT]: States.UNOWNED_SLOT,
                    [Transitions.BOUGHT]: States.OWNED_SLOT,
                },
                [handleLandedOnBuyableSlot],
                []
            ),

            new State<Transitions, States>(
                States.UNOWNED_SLOT,
                [Transitions.NOT_BOUGHT],
                {
                    [Transitions.BUY_PROPERTY]: States.BUY_PROPERTY,
                    [Transitions.DO_NOT_BUY_PROPERTY]: States.END_TURN,
                },
                [handleBuyingProperty],
                []
            ),

            new State<Transitions, States>(
                States.BUY_PROPERTY,
                [Transitions.BUY_PROPERTY],
                {}, // TODO Handle payment
                [],
                []
            ),

            new State<Transitions, States>(
                States.OWNED_SLOT,
                [Transitions.BOUGHT],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.OWNER_NOT_IN_JAIL]: States.PAY_RENT,
                },
                [handleJailRentCheck],
                []
            ),

            new State<Transitions, States>(
                States.PAY_RENT,
                [Transitions.OWNER_NOT_IN_JAIL],
                {}, // TODO: Handle payment
                [],
                []
            ),

            new State<Transitions, States>(
                States.FREE_PARKING,
                [Transitions.LAND_ON_FREE_PARKING],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleFreeParking],
                [],
            ),
        ], false);

        // Add the game to the map.
        this.games.set(board.id, machine);
    }

    /**
     * Get a state machine for a game.
     * @param game The game to get the state machine for.
     * @returns The state machine for the game.
     */
    getMachine(game: number | Board) {
        return this.games.get(typeof game === "number" ? game : game.id);
    }
}

/**
 * Function executed each time the "start of turn" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function startOfTurn(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "try escape jail" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function tryEscapeJail(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "landed on slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLanding(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function endTurn(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "landed on buyable slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLandedOnBuyableSlot(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "buy property" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleBuyingProperty(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "landed on bought slot" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleJailRentCheck(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * Function executed each time the "Free Parking" state is entered.
 * @param machine The state machine used to represent the game.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleFreeParking(machine: StateMachine<Transitions, States>, event: Transitions, additionalData?: any) {
    // TODO
}

/**
 * The game manager.
 */
export const Manager = new GameManager();