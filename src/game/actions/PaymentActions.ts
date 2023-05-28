import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent, Payment } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { Player } from '../../entity/Player';
import { Board } from '../../entity/Board';
import { AppDataSource } from '../../data-source';

const boardRepo = AppDataSource.getRepository(Board);
const playerRepo = AppDataSource.getRepository(Player);

/**
 * Map of payments that are waiting for the player to repay them.
 */
export const PendingPayments: Map<number, Payment> = new Map();

/**
 * Actions for general payment management.
 */
export const PaymentActions = {
    /**
     * Function executed each time the "player is in debt" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handlePlayerInDebt: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

        PendingPayments.set(additionalData.board.id, additionalData.payment);

        currentMachine.reset();

        getIo().to(`game-${additionalData.board.id}`).emit('playerInDebt', {
            gameId: additionalData.board.id,
            accountLogin: player.accountLogin,
            amount: additionalData.payment.amount,
        });
    },

    /**
     * Function executed each time the "check if player can afford" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleCheckIfPlayerCanAfford: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

        if(player.money < additionalData.payment.amount) {
            currentMachine.transition(Transitions.CANNOT_PAY, additionalData);
        } else {
            currentMachine.transition(Transitions.CAN_PAY, additionalData);
        }
    },

    /**
     * Function executed each time the "transfer money" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleTransferMoney: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

        let receiverStr = '';

        const promises: Promise<any>[] = [];

        if(additionalData.payment.receiver === 'jackpot') { // Jackpot
            player.money -= additionalData.payment.amount;
            additionalData.board.jackpot += additionalData.payment.amount;

            promises.push(playerRepo.save(player));
            promises.push(boardRepo.save(additionalData.board));

            receiverStr = 'jackpot';
        } else if(additionalData.payment.receiver === 'bank') { // Bank
            player.money -= additionalData.payment.amount;

            promises.push(playerRepo.save(player));

            receiverStr = 'bank';
        } else { // Player
            // A bit hacky, but it makes the TypeScript compiler happy.
            const target = additionalData.payment.receiver;
            if(target instanceof Player) {
                const receiver = additionalData.board.players.find(player => player.accountLogin === target.accountLogin);

                if(receiver) {
                    player.money -= additionalData.payment.amount;
                    receiver.money += additionalData.payment.amount;

                    promises.push(playerRepo.save(player));
                    promises.push(playerRepo.save(receiver));
                } else {
                    throw new Error(`Player ${additionalData.payment.receiver} does not exist.`);
                }

                receiverStr = target.accountLogin;
            } else { // This should never happen. Famous last words.
                throw new Error(`Invalid payment receiver: ${additionalData.payment.receiver}`);
            }
        }

        await Promise.all(promises);

        currentMachine.reset();

        getIo().to(`game-${additionalData.board.id}`).emit('paymentSucceeded', {
            gameId: additionalData.board.id,
            sender: player.accountLogin,
            receiver: receiverStr,
            amount: additionalData.payment.amount,
        });

        getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);

        // If there is a callback, execute it.
        if(additionalData.payment.callback) {
            await additionalData.payment.callback(currentMachine.getParentMachine(), player, additionalData.payment.receiver, additionalData.board);
        } else { // No callback, just end the turn.
            currentMachine.getParentMachine().transition(Transitions.END_TURN, {
                board: additionalData.board, // Remove the payment from the data passed to the next state.
            });
        }
    },
}