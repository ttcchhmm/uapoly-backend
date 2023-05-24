import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";
import { Board } from "./Board";
import { BuyableSlot, BuyableSlotState } from "./BuyableSlot";
import { Message } from "./Message";
import { PropertySlot } from "./PropertySlot";
import { AppDataSource } from "../data-source";
import { getIo } from "../socket/IoGlobal";
import { StateMachine } from "../state/StateMachine";
import { GameTransitions } from "../game/GameTransitions";
import { GameStates } from "../game/GameStates";
import { GameEvent } from "../game/GameManager";
import { BoardSlot } from "./BoardSlot";

/**
 * Represents a player in the database.
 */
@Entity()
export class Player {
    /**
     * The login of the account representing the player.
     */
    @PrimaryColumn()
    accountLogin: string;

    /**
     * The ID of the board the player is in.
     */
    @PrimaryColumn()
    gameId: number;

    /**
     * The account representing the player.
     */
    @ManyToOne(() => Account, account => account.players, {eager: false, cascade: false})
    account: Account;

    /**
     * The board the player is in.
     */
    @ManyToOne(() => Board, board => board.players, {eager: false, cascade: false})
    game: Board;

    /**
     * The amount of money the player has.
     */
    @Column()
    money: number;

    /**
     * The style of the player's icon.
     */
    @Column()
    iconStyle: number;

    /**
     * The number of out-of-jail cards the player has.
     */
    @Column()
    outOfJailCards: number;

    /**
     * The index of the slot the player is currently on.
     */
    @Column()
    currentSlotIndex: number;

    /**
     * Whether the player is in jail.
     */
    @Column()
    inJail: boolean;

    /**
     * True if the player is a game master.
     */
    @Column()
    isGameMaster: boolean;

    /**
     * The properties owned by the player.
     */
    @OneToMany(() => BuyableSlot, property => property.owner, {eager: false})
    ownedProperties: BuyableSlot[];

    /**
     * The private messages the player has received.
     */
    @OneToMany(() => Message, message => message.recipient, {eager: false})
    privateMessagesReceived: Promise<Message[]>;

    /**
     * The messages the player has sent.
     */
    @OneToMany(() => Message, message => message.sender, {eager: false})
    messagesSent: Promise<Message[]>;

    /**
     * Bankrupt the player.
     * @param quitted Whether the bankruptcy is due to the player quitting the game.
     */
    async bankrupt(board: Board, quitted: boolean = false) {
        this.money = 0;

        const promises: Promise<any>[] = [playerRepo.save(this)];
        this.ownedProperties.forEach(property => {
            property.owner = null;
            property.state = BuyableSlotState.AVAILABLE;
            
            // TODO : (Game Balance) maybe we should keep the buildings for the next player.
            if(property instanceof PropertySlot) {
                property.numberOfBuildings = 0;
            }
    
            promises.push(slotsRepo.save(property));
        });
    
        await Promise.all(promises);

        // Not pretty here, but a player can go bankrupt outside of the state machine and we need to notify the clients.
        getIo().to(`game-${board.id}`).emit('bankrupt', {
            gameId: board.id,
            accountLogin: this.accountLogin,
            quitted,
        });

        getIo().to(`game-${board.id}`).emit('update', board);

        // TODO: force skip turn if it's the player's turn.
    }

    /**
     * Move the player on the board.
     * @param stateMachine The state machine of the game.
     * @param numberOfSlots The number of slots to move the player.
     */
    async movePlayer(stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, numberOfSlots: number, board: Board) {
        // Passed Go
        if(this.currentSlotIndex + numberOfSlots > board.slots.length) {
            this.currentSlotIndex = (this.currentSlotIndex + numberOfSlots) % board.slots.length;

            playerRepo.save(this);
            getIo().to(`game-${board.id}`).emit('update', board);
            stateMachine.transition(GameTransitions.PASS_START, { board });
        } else {
            this.currentSlotIndex = (this.currentSlotIndex + numberOfSlots) % board.slots.length;

            playerRepo.save(this);
            getIo().to(`game-${board.id}`).emit('update', board);
            stateMachine.transition(GameTransitions.MOVED_PLAYER, { board });
        }
    }

    async movePlayerTo(stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, slotIndex: number, board: Board) {
        const numberOfSlots = slotIndex - this.currentSlotIndex;

        this.currentSlotIndex = slotIndex;
        await playerRepo.save(this);
        getIo().to(`game-${board.id}`).emit('update', board);

        // Passed Go
        if(numberOfSlots < 0) {
            stateMachine.transition(GameTransitions.PASS_START, { board });
        } else {
            stateMachine.transition(GameTransitions.MOVED_PLAYER, { board });
        }
    }

    /**
     * Move the player to the nearest slot of the given type.
     * @param stateMachine The state machine of the game.
     * @param slotType The type of slot to move the player to.
     */
    async movePlayerToNearest<T extends new(...args: any[]) => BoardSlot>(stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, slotType: T, board: Board) {
        let i = this.currentSlotIndex + 1; // Start at the next slot
        while(i !== this.currentSlotIndex) {
            // Wrap around
            if(i >= board.slots.length) {
                i = 0;
            }

            const slot = board.slots[i];
            if(slot instanceof slotType) { // If the slot is of the given type
                await this.movePlayerTo(stateMachine, i % board.slots.length, board);
                return;
            }

            i++;
        }

        // If we get here, it means that no slot of the given type was found. Should not happen with the default boards.
        throw new Error(`No slot of the given type was found: ${slotType.constructor.name}`);
    }
}

// At the bottom to avoid getting "Player is used before its declaration".
const playerRepo = AppDataSource.getRepository(Player);
const slotsRepo = AppDataSource.getRepository(BuyableSlot);