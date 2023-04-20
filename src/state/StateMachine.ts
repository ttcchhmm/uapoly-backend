import { State } from "./State";

/**
 * Defines a state machine.
 * 
 * @template T An enum of all the possible transitions that can occur.
 * @template N An enum of all the possible states that can occur.
 */
export class StateMachine<T extends string, N> {
    /**
     * The current state of the state machine.
     */
    private currentState: State<T, N>;

    /**
     * An array of all the states in the state machine.
     */
    private states: State<T, N>[];

    /**
     * Whether or not to throw an error when an invalid transition is attempted.
     */
    private throwOnInvalidTransition: boolean;

    /**
     * Constructs a new state machine.
     * @param initialState The initial state of the state machine.
     * @param states The states of the state machine.
     * @param throwOnInvalidTransition Whether or not to throw an error when an invalid transition is attempted.
     */
    constructor(initialState: N, states: State<T, N>[], throwOnInvalidTransition = true) {
        this.states = states;
        this.throwOnInvalidTransition = throwOnInvalidTransition;

        // Set the parent machine of each state
        this.states.forEach((state) => state.setParentMachine(this));

        // Get the initial state
        this.currentState = states.find((state) => state.getName() === initialState);

        // Check if initial state is defined
        if (this.currentState === undefined) {
            throw new Error(`State ${initialState} is not defined.`);
        }

        // Enter the initial state
        this.currentState.enter(undefined);
    }

    /**
     * Transitions the state machine to the next state.
     * @param event The event to transition on.
     */
    public transition(event: T) {
        // Check out transitions of current state
        if (!this.currentState.getOutTransitions()[event] && this.throwOnInvalidTransition) {
            throw new Error(`Invalid transition from ${this.currentState.getName()} with event ${event}`);
        } else {
            // Get the new state
            const newState = this.states.find((state) => state.getName() === this.currentState.getOutTransitions()[event]);

            // Check if new state is defined
            if(this.currentState === undefined) {
                throw new Error(`State ${this.currentState.getName()} is not defined.`);
            }

            // Check in transitions of new state
            if(!newState.getInTransitions().includes(event) && this.throwOnInvalidTransition) {
                throw new Error(`Invalid transition from ${this.currentState.getName()} to ${newState.getName()} with event ${event}`);
            } else {
                this.currentState = newState;
                this.currentState.enter(event);
            }
        }
    }

    /**
     * Gets the current state of the state machine.
     * @returns The current state of the state machine.
     */
    public getCurrentState(): N {
        return this.currentState.getName();
    }
}