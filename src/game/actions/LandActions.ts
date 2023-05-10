import { StateMachine } from '../../state/StateMachine';
import { GameStates as States } from "../GameStates";
import { GameTransitions as Transitions } from "../GameTransitions";
import { GameEvent } from '../GameManager';
import { getIo } from '../../socket/IoGlobal';
import { Player } from '../../entity/Player';
import { AppDataSource } from '../../data-source';
import { CardSlot, CardStyle } from '../../entity/CardSlot';
import { FreeParkingSlot } from '../../entity/FreeParkingSlot';
import { GoToJailSlot } from '../../entity/GoToJailSlot';
import { BuyableSlot, BuyableSlotState } from '../../entity/BuyableSlot';
import { TaxSlot } from '../../entity/TaxSlot';
import { Board } from '../../entity/Board';
import { Card } from '../../defaults/CardsActions';
import { Slots } from '../../defaults/Slots';
import { BoardSlot } from '../../entity/BoardSlot';
import { PropertySlot } from '../../entity/PropertySlot';
import { TrainStationSlot } from '../../entity/TrainStationSlot';
import { UtilitySlot } from '../../entity/UtilitySlot';
import { rollDices } from '../Dices';

const playerRepo = AppDataSource.getRepository(Player);
const boardRepo = AppDataSource.getRepository(Board);
const slotsRepo = AppDataSource.getRepository(BoardSlot);

/**
 * Actions when a player lands on a slot.
 */
export const LandActions = {
    /**
     * Function executed each time the "landed on slot" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleLanding: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    
        // Pay salary if the player passed the start slot
        if(event === Transitions.PASS_START) {
            player.money += additionalData.board.salary;
            await playerRepo.save(player);
        }
    
        // Update the clients
        getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
    
        if(player.currentSlotIndex === 0) {
            currentMachine.transition(Transitions.LAND_ON_START, additionalData);
        } else {
            const currentSlot = additionalData.board.slots[player.currentSlotIndex];
    
            if(currentSlot instanceof CardSlot) {
                currentMachine.transition(Transitions.LAND_ON_DRAW_CARD, additionalData);
            } else if(currentSlot instanceof FreeParkingSlot) {
                currentMachine.transition(Transitions.LAND_ON_FREE_PARKING, additionalData);
            } else if(currentSlot instanceof GoToJailSlot) {
                currentMachine.transition(Transitions.LAND_ON_GO_TO_JAIL, additionalData);
            } else if(currentSlot instanceof BuyableSlot) {
                currentMachine.transition(Transitions.LAND_ON_BUYABLE, additionalData);
            } else if(currentSlot instanceof TaxSlot) {
                currentMachine.transition(Transitions.LAND_ON_TAX, additionalData);
            } else {
                throw new Error(`Unknown slot type: ${currentSlot.constructor.name}`);
            }
        }
    },

    /**
     * Function executed each time the "landed on buyable slot" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleLandedOnBuyableSlot: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const slot = additionalData.board.slots[player.currentSlotIndex];
    
        if(slot instanceof BuyableSlot && slot.owner) {
            currentMachine.transition(Transitions.BOUGHT, additionalData);
        } else {
            currentMachine.transition(Transitions.NOT_BOUGHT, additionalData);
        }
    },

    /**
     * Function executed each time the "Free Parking" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleFreeParking: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        player.money += additionalData.board.jackpot;
    
        additionalData.board.jackpot = 0;
        await Promise.all([
            playerRepo.save(player),
            boardRepo.save(additionalData.board),
        ]);
    
        getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
        currentMachine.transition(Transitions.END_TURN, additionalData);
    },

    /**
     * Function executed each time the "landed on Go" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleGo: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        player.money += additionalData.board.salary;
    
        await playerRepo.save(player);
    
        getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
        currentMachine.transition(Transitions.END_TURN, additionalData);
    },

    /**
     * Function executed each time the "landed on Draw Card" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleDrawCard: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const slot = additionalData.board.slots[player.currentSlotIndex];
        
        if(slot instanceof CardSlot) {
            const deck = Slots.get(additionalData.board.locale).deck[slot.cardStyle];
            const card = deck[Math.floor(Math.random() * deck.length)];
    
            getIo().to(`game-${additionalData.board.id}`).emit('cardDrawn', {
                gameId: additionalData.board.id,
                accountLogin: player.accountLogin,
                description: card.description,
            });
    
            await card.action(currentMachine, player);
        }
    },

    /**
     * Function executed each time the "Go To Jail" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleGoToJail: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        player.inJail = true;
        player.currentSlotIndex = additionalData.board.jailSlotIndex;
        await playerRepo.save(player);
    
        getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
        currentMachine.transition(Transitions.END_TURN, additionalData);
    },

    /**
     * Function executed each time the "buy property" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleBuyingProperty: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        getIo().to(`game-${additionalData.board.id}`).emit('landedOnUnowned', {
            gameId: additionalData.board.id,
            accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
            position: additionalData.board.players[additionalData.board.currentPlayerIndex].currentSlotIndex,
            price: (additionalData.board.slots[additionalData.board.players[additionalData.board.currentPlayerIndex].currentSlotIndex] as BuyableSlot).price,
        });
    },

    /**
     * Function executed each time the "landed on bought slot" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleJailRentCheck: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const slot = additionalData.board.slots[player.currentSlotIndex];

        if(slot instanceof BuyableSlot && slot.owner.inJail) {
            currentMachine.transition(Transitions.END_TURN, additionalData);
        } else {
            currentMachine.transition(Transitions.OWNER_NOT_IN_JAIL, additionalData);
        }
    },

    /**
     * Function executed each time the "pay property" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handlePayingProperty: async (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const slot = additionalData.board.slots[player.currentSlotIndex];

        if(slot instanceof BuyableSlot) {
            slot.state = BuyableSlotState.OWNED;
            slot.owner = player;

            getIo().to(`game-${additionalData.board.id}`).emit('propertyBought', {
                gameId: additionalData.board.id,
                accountLogin: player.accountLogin,
                slotIndex: player.currentSlotIndex,
                price: slot.price,
            });

            await slotsRepo.save(slot);

            currentMachine.transition(Transitions.PAY_BANK, {
                payment: {
                    receiver: 'bank',
                    amount: slot.price,
                },

                ...additionalData,
            });
        }
    },

    /**
     * Function executed each time the "pay rent" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handleRent: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const property = additionalData.board.slots[player.currentSlotIndex];

        if(property instanceof BuyableSlot) {
            const data: GameEvent = {
                payment: {
                    receiver: property.owner,
                    amount: undefined,
                },

                ...additionalData,
            };
        
            if(property instanceof PropertySlot) {
                switch(property.numberOfBuildings) {
                    case 0:
                        data.payment.amount = property.propertyRent.noBuildings;
                        break;

                    case 1:
                        data.payment.amount = property.propertyRent.oneBuilding;
                        break;

                    case 2:
                        data.payment.amount = property.propertyRent.twoBuildings;
                        break;

                    case 3:
                        data.payment.amount = property.propertyRent.threeBuildings;
                        break;

                    case 4:
                        data.payment.amount = property.propertyRent.fourBuildings;
                        break;

                    case 5:
                        data.payment.amount = property.propertyRent.hotel;
                        break;
                }
            } else if(property instanceof TrainStationSlot) {
                const numberOfTrainStations = property.owner.ownedProperties.filter(slot => slot instanceof TrainStationSlot).length;

                switch(numberOfTrainStations) {
                    case 1:
                        data.payment.amount = property.trainRent.oneStation;
                        break;
                    case 2:
                        data.payment.amount = property.trainRent.twoStations;
                        break;
                    case 3:
                        data.payment.amount = property.trainRent.threeStations;
                        break;
                    case 4:
                        data.payment.amount = property.trainRent.fourStations;
                        break;
                }
            } else if(property instanceof UtilitySlot) {
                const dices = rollDices(2);

                getIo().to(`game-${additionalData.board.id}`).emit('diceRoll', {
                    gameId: additionalData.board.id,
                    accountLogin: player.accountLogin,
                    dices,
                });

                const numberOfUtilities = property.owner.ownedProperties.filter(slot => slot instanceof UtilitySlot).length;

                if(numberOfUtilities === 1) {
                    data.payment.amount = (dices[0] + dices[1]) * 4;
                } else if(numberOfUtilities === 2) {
                    data.payment.amount = (dices[0] + dices[1]) * 10;
                }
            }

            currentMachine.transition(Transitions.PAY_PLAYER, data);
        } else {
            throw new Error(`Player is not on a buyable slot: ${property.constructor.name}}`);
        }
    },

    /**
     * Function executed each time the "pay tax" state is entered.
     * @param currentMachine The state machine used to represent the game.
     * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
     * @param event The event that triggered the transition.
     * @param additionalData Additional data passed with the event.
     */
    handlePayTax: (currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) => {
        const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
        const slot = additionalData.board.slots[player.currentSlotIndex];

        if(slot instanceof TaxSlot) {
            currentMachine.transition(Transitions.PAY_BANK, {
                payment: {
                    receiver: 'jackpot',
                    amount: slot.amount,
                },

                ...additionalData,
            });
        } else {
            throw new Error(`Player is not on a tax slot: ${slot.constructor.name}}`);
        }
    },
}