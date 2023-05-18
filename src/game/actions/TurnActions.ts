import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent, Manager } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { AppDataSource } from '../../data-source';
import { Board } from '../../entity/Board';
import { rollDices } from '../Dices';

const boardRepo = AppDataSource.getRepository(Board);

/**
 * Actions for general turn management.
 */
export const TurnActions = {
    /**
     * Function executed each time the "start of turn" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    startOfTurn: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    
        if(player.money <= 0) {
            currentMachine.transition(Transitions.NEXT_PLAYER, additionalData);
        } else {
            getIo().to(`game-${additionalData.board.id}`).emit('startOfTurn', {
                gameId: additionalData.board.id,
                accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
            });

            getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board); 
    
            if(player.inJail) {
                currentMachine.transition(Transitions.IS_IN_JAIL, additionalData);
            } else {
                currentMachine.transition(Transitions.IS_NOT_IN_JAIL, additionalData);
            }
        }
    },

    /**
     * Function executed each time the "end turn" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleEndTurn: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        getIo().to(`game-${additionalData.board.id}`).emit('endOfTurn', {
            gameId: additionalData.board.id,
            accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
        });
    },

    /**
     * Function executed each time the "next player" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleNextPlayer: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        if(additionalData.board.currentPlayerIndex + 1 >= additionalData.board.players.length) {
            additionalData.board.currentPlayerIndex = 0;
        } else {
            additionalData.board.currentPlayerIndex++;
        }
    
        await boardRepo.save(additionalData.board);
        
        if(additionalData.board.players.reduce((acc, player) => {
            if(player.money <= 0) {
                return acc;
            } else {
                return acc + 1;
            }
        }, 0) > 1) {
            currentMachine.transition(Transitions.NEXT_TURN, additionalData);
        } else {
            currentMachine.transition(Transitions.GAME_OVER, additionalData);
        }
    },

    /**
     * Function executed each time the "game over" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleGameOver: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const winner = additionalData.board.players.find(player => player.money > 0);
        await Manager.stopGame(additionalData.board, winner);
    },

    /**
     * Function executed each time the "roll dices" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleRollDice: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const dices = rollDices(2); // TODO: Make the number of dices configurable.
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    
        getIo().to(`game-${additionalData.board.id}`).emit('diceRoll', {
            gameId: additionalData.board.id,
            dices,
            accountLogin: player.accountLogin,
        });
    
        const total = dices.reduce((acc, val) => acc + val, 0);
    
        await player.movePlayer(currentMachine, total, additionalData.board);
    },
}