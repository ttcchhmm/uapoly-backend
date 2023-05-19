import { AppDataSource } from "../data-source";
import { Board } from "../entity/Board";
import { CardStyle } from "../entity/CardSlot";
import { Player } from "../entity/Player";
import { PropertySlot } from "../entity/PropertySlot";
import { TrainStationSlot } from "../entity/TrainStationSlot";
import { UtilitySlot } from "../entity/UtilitySlot";
import { GameEvent } from "../game/GameManager";
import { GameStates } from "../game/GameStates";
import { GameTransitions } from "../game/GameTransitions";
import { getIo } from "../socket/IoGlobal";
import { StateMachine } from "../state/StateMachine";

/**
 * Represent a function that can be called when a card is drawn.
 * 
 * @param stateMachine The state machine of the game.
 * @param player The player that drew the card.
 */
type CardActionFunction = (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => Promise<void>;

/**
 * Represent a card.
 */
export interface Card {
    description: string,
    action: CardActionFunction,
}

/**
 * Represent a deck of cards.
 */
export type CardDeck = {
    /**
     * The cards of a given type in the deck.
     */
    [Key in CardStyle]: Card[];
}

const playerRepo = AppDataSource.getRepository(Player);

/**
 * The actions that can be performed when a chance card is drawn.
 */
export const ChanceActions: CardActionFunction[] = [
    // Advance to Boardwalk
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerTo(stateMachine, 39, board);
    },

    // Advance to Go
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerTo(stateMachine, 0, board);
    },

    // Advance to Illinois Ave
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerTo(stateMachine, 24, board);
    },

    // Advance to St. Charles Place
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerTo(stateMachine, 11, board);
    },

    // Advance to the nearest railroad
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerToNearest(stateMachine, TrainStationSlot, board);
    },

    // Advance to the nearest utility
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        await player.movePlayerToNearest(stateMachine, UtilitySlot, board);
    },

    // Bank pays you dividend of $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 50;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board: board });
    },

    // Get out of jail free
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        // TODO: Limit to 2 cards max per game

        player.outOfJailCards++;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board: board });
    },

    // Go back 3 spaces
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        if(player.currentSlotIndex < 3) {
            player.currentSlotIndex = board.slots.length - (3 - player.currentSlotIndex);
        } else {
            player.currentSlotIndex -= 3;
        }

        await playerRepo.save(player);

        stateMachine.transition(GameTransitions.MOVED_PLAYER, { board });
    },

    // Go to jail
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.DREW_GO_TO_JAIL_CARD, { board });
    },

    // You are assessed for street repairs. $40 per house. $115 per hotel.
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        let total = 0;

        player.ownedProperties.forEach(property => {
            if(property instanceof PropertySlot) {
                if(property.numberOfBuildings <= 4) {
                    total += property.numberOfBuildings * 40;
                } else {
                    total += 115;
                }
            } 
        });

        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: total,
                receiver: 'jackpot',
            },
        });
    },

    // Pay speeding fine of $15
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: 15,
                receiver: 'jackpot',
            },
        });
    },

    // Take a trip to Reading Railroad
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.movePlayerTo(stateMachine, 5, board);
    },

    // You have been elected chairman of the board. Pay each player $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: 50 * (board.players.length - 1),
                receiver: 'bank',
                callback: async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, receiver: Player | 'bank' | 'jackpot', board: Board) => {
                    const promises: Promise<any>[] = [];

                    board.players.forEach(async (otherPlayer) => {
                        if(player !== otherPlayer) { // Don't pay yourself
                            otherPlayer.money += 50;
                            promises.push(playerRepo.save(otherPlayer));
                        }
                    });

                    await Promise.all(promises);

                    getIo().to(`game-${board.id}`).emit('update', board);
                    stateMachine.transition(GameTransitions.END_TURN, { board });
                },
            },
        });
    },

    // Your building and loan matures. Collect $150
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 150;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },
];

/**
 * The actions that can be performed when a community chest card is drawn.
 */
export const CommunityChestActions: CardActionFunction[] = [
    // Advance to Go
    ChanceActions[1],

    // Bank error in your favor. Collect $200
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 200;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // Doctor's fee. Pay $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: 50,
                receiver: 'jackpot',
            },
        });
    },

    // From sale of stock you get $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 50;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // Get out of jail free
    ChanceActions[7],

    // Go to jail
    ChanceActions[9],

    // Holiday fund matures. Collect $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // Income tax refund. Collect $20
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 20;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // Life insurance matures. Collect $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },
    
    // Pay hospital fees of $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: 100,
                receiver: 'jackpot',
            },
        });
    },

    // Pay school fees of $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        stateMachine.transition(GameTransitions.PAY_BANK, {
            board,
            payment: {
                amount: 50,
                receiver: 'jackpot',
            },
        });
    },

    // Receive $25 consultancy fee
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 25;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // You are assessed for street repairs. $40 per house. $115 per hotel
    ChanceActions[10],

    // You have won second prize in a beauty contest. Collect $10
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 10;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },

    // You inherit $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player, board: Board) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${board.id}`).emit('update', board);
        stateMachine.transition(GameTransitions.END_TURN, { board });
    },
];