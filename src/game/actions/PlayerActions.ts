import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { BuyableSlotState } from '../../entity/BuyableSlot';
import { PropertySlot } from '../../entity/PropertySlot';
import { AppDataSource } from '../../data-source';
import { BoardSlot } from '../../entity/BoardSlot';

const slotsRepo = AppDataSource.getRepository(BoardSlot);

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
        await additionalData.board.players[additionalData.board.currentPlayerIndex].bankrupt();
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
            additionalData.propertiesEdit.forEach(propertyEdit => {
                const property = player.ownedProperties.find(p => p.position === propertyEdit.position);
    
                if(property) {
                    if(propertyEdit.newState === BuyableSlotState.MORTGAGED && property.state === BuyableSlotState.OWNED) {
                        debt -= property.getMortgageValue();
                        property.state = BuyableSlotState.MORTGAGED;
                    } else if(propertyEdit.newState === BuyableSlotState.OWNED && property.state === BuyableSlotState.MORTGAGED) {
                        debt += property.getUnmortgagePrice();
                        property.state = BuyableSlotState.OWNED;
                    }
    
                    if(propertyEdit.newNumberOfBuildings >= 0 && propertyEdit.newNumberOfBuildings <= 5 && property instanceof PropertySlot) {
                        debt += (property.numberOfBuildings - propertyEdit.newNumberOfBuildings) * property.buildingPrice;
                        property.numberOfBuildings = propertyEdit.newNumberOfBuildings;
                    }
    
                    promises.push(slotsRepo.save(property));
                }
            });
    
            await Promise.all(promises);
    
            getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
    
            if(debt < 0) {
                player.money -= debt;
            } else {
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
    
        if(transition === Transitions.END_TURN) {
            currentMachine.transition(Transitions.END_TURN, {
                board: additionalData.board,
            });
        } else {
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