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
    @ManyToOne(() => Account, account => account.players, {eager: false})
    account: Account;

    /**
     * The board the player is in.
     */
    @ManyToOne(() => Board, board => board.players, {eager: false})
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
    @OneToMany(() => BuyableSlot, property => property.owner, {eager: true})
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
    async bankrupt(quitted: boolean = false) {
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
        getIo().to(`game-${this.gameId}`).emit('bankrupt', {
            gameId: this.gameId,
            accountLogin: this.accountLogin,
            quitted,
        });

        // TODO: force skip turn if it's the player's turn.
    }

    /**
     * Move the player on the board.
     * @param stateMachine The state machine of the game.
     * @param numberOfSlots The number of slots to move the player.
     */
    async movePlayer(stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, numberOfSlots: number) {
        // Passed Go
        if(this.currentSlotIndex + numberOfSlots > this.game.slots.length) {
            this.currentSlotIndex = (this.currentSlotIndex + numberOfSlots) % this.game.slots.length;

            playerRepo.save(this);
            getIo().to(`game-${this.gameId}`).emit('update', this.game);
            stateMachine.transition(GameTransitions.PASS_START, { board: this.game });
        } else {
            this.currentSlotIndex = (this.currentSlotIndex + numberOfSlots) % this.game.slots.length;

            playerRepo.save(this);
            getIo().to(`game-${this.gameId}`).emit('update', this.game);
            stateMachine.transition(GameTransitions.MOVED_PLAYER, { board: this.game });
        }
    }

    async movePlayerTo(stateMachine: StateMachine<GameTransitions, GameStates, GameEvent>, slotIndex: number) {
        const numberOfSlots = slotIndex - this.currentSlotIndex;

        this.currentSlotIndex = slotIndex;
        await playerRepo.save(this);
        getIo().to(`game-${this.gameId}`).emit('update', this.game);

        // Passed Go
        if(numberOfSlots < 0) {
            stateMachine.transition(GameTransitions.PASS_START, { board: this.game });
        } else {
            stateMachine.transition(GameTransitions.MOVED_PLAYER, { board: this.game });
        }
    }
}

// At the bottom to avoid getting "Player is used before its declaration".
const playerRepo = AppDataSource.getRepository(Player);
const slotsRepo = AppDataSource.getRepository(BuyableSlot);