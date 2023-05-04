import { AppDataSource } from "../data-source";
import { Player } from "../entity/Player";
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
type CardActionFunction = (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => Promise<void>;

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
export interface CardDeck {
    /**
     * The chance cards.
     */
    chance: Card[],

    /**
     * The community chest cards.
     */
    communityChest: Card[],
}

const playerRepo = AppDataSource.getRepository(Player);

/**
 * The actions that can be performed when a chance card is drawn.
 */
export const ChanceActions: CardActionFunction[] = [
    // Advance to Boardwalk
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Advance to Go
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.currentSlotIndex = 0;
        
        await playerRepo.save(player);
        stateMachine.transition(GameTransitions.MOVED_PLAYER, { board: player.game });
    },

    // Advance to Illinois Ave
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Advance to St. Charles Place
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Advance to the nearest railroad
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Advance to the nearest utility
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Bank pays you dividend of $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 50;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Get out of jail free
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Limit to 2 cards max per game

        player.outOfJailCards++;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Go back 3 spaces
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        if(player.currentSlotIndex < 3) {
            player.currentSlotIndex = player.game.slots.length - (3 - player.currentSlotIndex);
        } else {
            player.currentSlotIndex -= 3;
        }

        await playerRepo.save(player);

        stateMachine.transition(GameTransitions.MOVED_PLAYER, { board: player.game });
    },

    // Go to jail
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        stateMachine.transition(GameTransitions.DREW_GO_TO_JAIL_CARD, { board: player.game });
    },

    // You are assessed for street repairs. $40 per house. $115 per hotel.
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Pay speeding fine of $15
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Take a trip to Reading Railroad
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // You have been elected chairman of the board. Pay each player $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Your building and loan matures. Collect $150
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 150;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },
];

/**
 * The actions that can be performed when a community chest card is drawn.
 */
export const CommunityChestActions: CardActionFunction[] = [
    // Advance to Go
    ChanceActions[1],

    // Bank error in your favor. Collect $200
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 200;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Doctor's fee. Pay $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // From sale of stock you get $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 50;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Get out of jail free
    ChanceActions[7],

    // Go to jail
    ChanceActions[9],

    // Holiday fund matures. Collect $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Income tax refund. Collect $20
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 20;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // Life insurance matures. Collect $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },
    
    // Pay hospital fees of $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Pay school fees of $50
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        // TODO: Implement
    },

    // Receive $25 consultancy fee
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 25;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // You are assessed for street repairs. $40 per house. $115 per hotel
    ChanceActions[10],

    // You have won second prize in a beauty contest. Collect $10
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 10;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },

    // You inherit $100
    async (stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, player: Player) => {
        player.money += 100;
        await playerRepo.save(player);

        getIo().to(`game-${player.game.id}`).emit('update', player.game);
        stateMachine.transition(GameTransitions.END_TURN, { board: player.game });
    },
];