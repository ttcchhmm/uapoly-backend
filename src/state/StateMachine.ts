import { OutTransitions, State } from "./State";

/**
 * Represents something that can act as a state.
 */
type Stateable<T extends string, N, D> = State<T, N, D> | StateMachine<T, N, D>;

/**
 * The settings to use if this state machine is embedded.
 */
interface EmbedSettings<T extends string, N, D> {
    /**
     * The state name representing this state machine.
     */
    name: N;

    /**
     * The transitions that can be made to this state machine.
     */
    inTransitions: T[];

    /**
     * The transitions that can be made from this state machine.
     */
    outTransitions: OutTransitions<T, N>;

    /**
     * The parent machine of this state machine.
     */
    parent: StateMachine<T, N, D>;
}

/**
 * Defines a state machine.
 * 
 * @template T An enum of all the possible transitions that can occur.
 * @template N An enum of all the possible states that can occur.
 * @template D The type of the additional data that can be passed to the transition functions.
 */
export class StateMachine<T extends string, N, D> {
    /**
     * The name of the state machine, if embedded.
     */
    private name: N | undefined;

    /**
     * The transitions that can be made to this machine, if embedded.
     */
    private inTransitions: T[] | undefined;

    /**
     * The transitions that can be made from this machine, if embedded.
     */
    private outTransitions: OutTransitions<T, N> | undefined;

    /**
     * The parent machine of this state machine, if embedded.
     */
    private parentMachine: StateMachine<T, N, D> | undefined;

    /**
     * Whether or not the state machine has been reset.
     */
    private isReset;

    /**
     * The initial state of the state machine.
     */
    private initialStateName: N;

    /**
     * The current state of the state machine.
     */
    private currentState: Stateable<T, N, D>;

    /**
     * An array of all the states in the state machine.
     */
    private states: Stateable<T, N, D>[];

    /**
     * Whether or not to throw an error when an invalid transition is attempted.
     */
    private throwOnInvalidTransition: boolean;

    /**
     * Constructs an non-embeddable new state machine.
     * @param initialState The initial state of the state machine.
     * @param states The states of the state machine.
     * @param throwOnInvalidTransition Whether or not to throw an error when an invalid transition is attempted.
     * @param embedSettings The settings to use if this state machine is embedded.
     */
    constructor(initialState: N, states: Stateable<T, N, D>[], throwOnInvalidTransition = true, embedSettings?: EmbedSettings<T, N, D>) {
        this.initialStateName = initialState;
        this.name = undefined;
        this.isReset = false;
        this.states = states;
        this.throwOnInvalidTransition = throwOnInvalidTransition;

        // Set the parent machine of each state
        this.states.forEach((state) => {
            if(state instanceof State) {
                state.setParentMachine(this);
            }
        });

        // Get the initial state
        this.currentState = states.find((state) => state.getName() === initialState);

        // Check if initial state is defined
        if (this.currentState === undefined) {
            throw new Error(`State ${initialState} is not defined.`);
        }

        // Set the embed settings if they exist
        if(embedSettings) {
            this.name = embedSettings.name;
            this.inTransitions = embedSettings.inTransitions;
            this.outTransitions = embedSettings.outTransitions;
            this.parentMachine = embedSettings.parent;
            this.isReset = true;
        } else { // Main machine, enter the initial state
            this.currentState.enter(undefined);
        }
    }

    /**
     * Transitions the state machine to the next state.
     * @param event The event to transition on.
     * @param additionalData Additional data to pass to the transition functions.
     */
    public transition(event: T, additionalData?: D, parentMachine?: StateMachine<T, N, D>) {
        if(this.currentState instanceof State) { // Proper state
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
                    if(!this.isReset) {
                        this.currentState.exit(event, additionalData, parentMachine);
                    } else {
                        this.isReset = false;
                    }

                    this.currentState = newState;
                    this.currentState.enter(event, additionalData, parentMachine);
                }
            }
        } else { // Embedded state machine
            this.currentState.transition(event, additionalData, this.parentMachine);
        }
    }

    /**
     * Gets the current state of the state machine.
     * @returns The current state of the state machine.
     */
    public getCurrentState(): N {
        return this.currentState.getName();
    }

    /**
     * Gets the name of the state machine.
     * @returns The name of the state machine.
     */
    public getName(): N | undefined {
        return this.name;
    }

    /**
     * Gets the transitions that can be made to this machine, if embedded.
     * @returns The transitions that can be made to this machine, if embedded.
     */
    public getOutTransitions(): OutTransitions<T, N> {
        return this.outTransitions;
    }

    /**
     * Gets the transitions that can be made from this machine, if embedded.
     * @returns The transitions that can be made from this machine, if embedded.
     */
    public getInTransitions(): T[] {
        return this.inTransitions;
    }

    /**
     * Whether or not the state machine is embedded.
     * @returns Whether or not the state machine is embedded.
     */
    public isEmbedded(): boolean {
        return this.name !== undefined;
    }

    /**
     * Enters the current state of the state machine.
     * @param event The event to transition on.
     * @param additionalData Additional data to pass to the transition functions. Can be undefined.
     * @param parentMachine The parent machine of this state machine, if embedded.
     */
    public enter(event: T, additionalData?: D, parentMachine?: StateMachine<T, N, D>) {
        this.currentState.enter(event, additionalData, parentMachine);
    }

    /**
     * Reset the embedded state machine to its initial state.
     * 
     * Designed to be used by a state owned by the embedded state machine.
     */
    public reset() {
        this.states.forEach((state) => {
            if(state instanceof StateMachine) {
                state.reset();
            }
        });

        this.currentState = this.states.find((state) => state.getName() === this.initialStateName);
        this.isReset = true;
    }

    /**
     * Generates a string representation of the state machine in the DOT language.
     * @returns A string representation of the state machine in the DOT language.
     */
    public generateDot(): string {
        let dot = "digraph {\n";

        this.states.forEach((state) => {
            dot += `    ${state.getName()} [label="${state.getName()}"];\n`;
        });

        this.states.forEach((state) => {
            Object.keys(state.getOutTransitions()).forEach((transition) => {
                dot += `    ${state.getName()} -> ${(state.getOutTransitions() as any)[transition]} [label="${transition}"];\n`;
            });
        });

        dot += "}";

        return dot;
    }
}