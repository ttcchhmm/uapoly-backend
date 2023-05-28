import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { BuyableSlot, BuyableSlotState } from '../../entity/BuyableSlot';
import { PropertySlot } from '../../entity/PropertySlot';
import { AppDataSource } from '../../data-source';
import { BoardSlot } from '../../entity/BoardSlot';
import { Player } from '../../entity/Player';

const slotsRepo = AppDataSource.getRepository(BoardSlot);
const playerRepo = AppDataSource.getRepository(Player);

/**
 * Actions for player management.
 */
export const PlayerActions = {
    /**
     * Function executed each time the "declare bankruptcy" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleDeclareBankruptcy: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        await additionalData.board.players[additionalData.board.currentPlayerIndex].bankrupt(additionalData.board);
        currentMachine.transition(Transitions.NEXT_PLAYER, additionalData);
    },

    /**
     * Function executed each time the "manage properties" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleManageProperties: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        if(additionalData.propertiesEdit) {
            const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    
            let debt = 0;
    
            const promises: Promise<any>[] = [];

            for(const propertyEdit of additionalData.propertiesEdit) {
                const property = additionalData.board.slots.find(p => p.position === propertyEdit.position);
    
                if(property instanceof BuyableSlot && property.owner.accountLogin === player.accountLogin) {
                    if(propertyEdit.newState === BuyableSlotState.MORTGAGED && property.state === BuyableSlotState.OWNED) {
                        debt -= property.getMortgageValue();
                        property.state = BuyableSlotState.MORTGAGED;
                    } else if(propertyEdit.newState === BuyableSlotState.OWNED && property.state === BuyableSlotState.MORTGAGED) {
                        debt += property.getUnmortgagePrice();
                        property.state = BuyableSlotState.OWNED;
                    }
    
                    if(propertyEdit.newNumberOfBuildings >= 0 && propertyEdit.newNumberOfBuildings <= 5 && property instanceof PropertySlot) {
                        debt += (propertyEdit.newNumberOfBuildings - property.numberOfBuildings) * property.buildingPrice;
                        property.numberOfBuildings = propertyEdit.newNumberOfBuildings;
                    }
    
                    promises.push(slotsRepo.save(property));
                }
            }
    
            await Promise.all(promises);
        
            if(debt < 0) { // The bank owes the player money
                player.money -= debt;
                await playerRepo.save(player);

                getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
            } else { // The player owes the bank money
                getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);

                currentMachine.transition(Transitions.PAY_BANK, {
                    board: additionalData.board,
                    payment: {
                        receiver: 'bank',
                        amount: debt,
                    },
                });
            }
        }
    
        const transition = currentMachine.getTransitionHistory()
            .reverse()
            .find(transition => transition === Transitions.END_TURN || transition === Transitions.PAY_BANK || transition === Transitions.PAY_BAIL || transition === Transitions.PAY_PLAYER);
    
        // The player managed their properties at the end of their turn. End the turn.
        if(transition === Transitions.END_TURN) {
            currentMachine.transition(Transitions.END_TURN, {
                board: additionalData.board,
            });
        } else { // The player decided to manage properties to pay a debt. Continue the payment.
            currentMachine.transition(transition, {
                board: additionalData.board,
                payment: additionalData.payment,
            });
        }
    },

    /**
     * Function executed each time the "trade" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleTrade: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        // TODO
    },

    /**
     * Function executed each time the "trade accepted" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleTradeAccepted: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        // TODO
    },
}