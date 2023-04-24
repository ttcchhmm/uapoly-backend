import { StateMachine } from "./StateMachine";

/**
 * A map of all the possible transitions to a state.
 * 
 * @template T An enum of all the possible transitions that can occur.
 * @template N An enum of all the possible states that can occur.
 */
type OutTransitions<T extends string, N> = {
    /**
     * The transition to the state.
     */
    [Key in T]?: N;
}

/**
 * A function to be called when a transition occurs.
 * 
 * @template T An enum of all the possible transitions that can occur.
 * @template N An enum of all the possible states that can occur.
 * @template D The type of the additional data that can be passed to the transition functions.
 * 
 * @param machine The state machine.
 * @param event The event that caused the transition.
 * @param additionalData Additional data to be passed to the function.
 */
type TransitionFunction<T extends string, N, D> = (machine: StateMachine<T, N, D>, event: T, additionalData?: any) => void;

/**
 * A state in a state machine.
 * 
 * @template T An enum of all the possible transitions that can occur.
 * @template N An enum of all the possible states that can occur.
 * @template D The type of the additional data that can be passed to the transition functions.
 */
export class State<T extends string, N, D> {
    /**
     * The name of the state.
     */
    private name: N;

    /**
     * The transitions that can be made to this state.
     */
    private inTransitions: T[];

    /**
     * The transitions that can be made from this state.
     */
    private outTransitions: OutTransitions<T, N>;

    /**
     * The functions to be called when entering this state.
     */
    private onEnter: Array<TransitionFunction<T, N, D>>;

    /**
     * The functions to be called when exiting this state.
     */
    private onExit: Array<TransitionFunction<T, N, D>>;

    /**
     * The state machine that this state is a part of.
     */
    private machine: StateMachine<T, N, D>;

    /**
     * Constructs a new state.
     * @param name The name of the state.
     * @param inTransitions The transitions that can be made to this state.
     * @param outTransitions The transitions that can be made from this state.
     * @param enterFunctions The functions to be called when entering this state.
     * @param exitFunctions The functions to be called when exiting this state.
     */
    constructor(name: N, inTransitions: T[], outTransitions: OutTransitions<T, N>, enterFunctions: Array<TransitionFunction<T, N, D>>, exitFunctions: Array<TransitionFunction<T, N, D>>) {
        this.name = name;
        this.inTransitions = inTransitions;
        this.outTransitions = outTransitions;
        this.onEnter = enterFunctions;
        this.onExit = exitFunctions;
    }

    /**
     * Set the parent machine of this state.
     * @param machine The state machine that this state is a part of.
     */
    public setParentMachine(machine: StateMachine<T, N, D>) {
        this.machine = machine;
    }

    /**
     * Enter this state.
     * @param event The event to transition on.
     * @param additionalData Additional data to be passed to the transition functions.
     */
    public enter(event: T, additionalData?: D) {
        this.onEnter.forEach((func) => func(this.machine, event, additionalData));
    }

    /**
     * Exit this state.
     * @param event The event to transition on.
     * @param additionalData Additional data to be passed to the transition functions.
     */
    public exit(event: T, additionalData?: D) {
        this.onExit.forEach((func) => func(this.machine, event, additionalData));
    }

    /**
     * Get the transitions that can be made to this state.
     * @returns The transitions that can be made to this state.
     */
    public getInTransitions(): T[] {
        return this.inTransitions;
    }

    /**
     * Get the transitions that can be made from this state.
     * @returns The transitions that can be made from this state.
     */
    public getOutTransitions(): OutTransitions<T, N> {
        return this.outTransitions;
    }

    /**
     * Get the name of this state.
     * @returns The name of this state.
     */
    public getName(): N {
        return this.name;
    }
}