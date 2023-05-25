import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { Player } from '../../entity/Player';
import { AppDataSource } from '../../data-source';
import { rollDices } from '../Dices';

const playerRepo = AppDataSource.getRepository(Player);

/**
 * Actions for jail management.
 */
export const JailActions = {
    /**
     * Function executed each time the "try escape jail" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    tryEscapeJail: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        getIo().to(`game-${additionalData.board.id}`).emit('tryEscapeJail', {
            gameId: additionalData.board.id,
            accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
        });
    },

    /**
     * Function executed each time the "use out of jail card" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleUseOutOfJailCard: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        if(player.outOfJailCards > 0) {
            player.outOfJailCards--;
            player.inJail = false;
    
            await playerRepo.save(player);
    
            currentMachine.transition(Transitions.ROLL_DICE, additionalData);
        } else {
            currentMachine.transition(Transitions.IS_IN_JAIL, additionalData);
        }
    },

    /**
     * Function executed each time the "try escape with dice" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleEscapeWithDice: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const dices = rollDices(2);
    
        getIo().to(`game-${additionalData.board.id}`).emit('diceRoll', {
            gameId: additionalData.board.id,
            accountLogin: player.accountLogin,
            dices,
        });
    
        if(dices[0] === dices[1]) {
            player.inJail = false;
    
            await playerRepo.save(player);
            currentMachine.transition(Transitions.ROLL_DICE, additionalData);
        } else {
            currentMachine.transition(Transitions.END_TURN, additionalData);
        }
    },

    /**
     * Function executed each time the "pay bail" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handlePayBail: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        
        player.inJail = false;
        await playerRepo.save(player);

        currentMachine.transition(Transitions.PAY_BANK, {
            payment: {
                amount: 50,
                receiver: 'bank',
            },
    
            ...additionalData,
        });
    },
}