import { AfterLoad, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "./Player";
import { BoardSlot } from "./BoardSlot";
import { Message } from "./Message";

@Entity()
export class Board {
    /**
     * The ID of the board.
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The players in the board.
     */
    @OneToMany(() => Player, player => player.game, {eager: true})
    players: Player[];

    /**
     * The index of the current player.
     */
    @Column()
    currentPlayerIndex: number;

    /**
     * The current amount of money in the jackpot.
     */
    @Column()
    jackpot: number;

    /**
     * The amount of money players get when they pass the start slot.
     */
    @Column()
    salary: number;

    /**
     * The amount of money players get when they join the game.
     */
    @Column()
    initialMoney: number;

    /**
     * Whether the game has started or not.
     */
    @Column()
    started: boolean;

    /**
     * The index of the slot where the game starts.
     */
    @Column()
    startingSlotIndex: number;

    /**
     * The maximum number of players in the game.
     */
    @Column()
    maxPlayers: number;

    /**
     * The password of the game, null if it's a public game.
     */
    @Column({nullable: true, select: false})
    password: string | null;

    /**
     * Whether the game is only accessible to friends or not.
     */
    @Column()
    friendsOnly: boolean;

    /**
     * The name of the lobby.
     */
    @Column()
    name: string;

    /**
     * The index of the slot where players go when they go to jail.
     */
    @Column()
    jailSlotIndex: number;

    /**
     * The locale of the board.
     */
    @Column()
    locale: string;

    /**
     * The slots in the board.
     */
    @OneToMany(() => BoardSlot, slot => slot.board, {eager: true, cascade: true})
    slots: BoardSlot[];

    /**
     * The chat messages regarding the current game.
     */
    @OneToMany(() => Message, message => message.board, {eager: true})
    messages: Message[];

    /**
     * Searches for the game master of the game.
     * @returns The game master of the game.
     */
    getGameMaster(): Player {
        const gameMaster = this.players.find((player) => player.isGameMaster);

        if(!gameMaster) {
            throw new Error('Game master not found');
        }

        return gameMaster;
    }

    /**
     * Get a simplified version of the board, meant to be used in the lobby.
     * @returns The simplified version of the board.
     */
    getSimplified() {
        return {
            id: this.id,
            name: this.name,
            players: this.players.length,
            maxPlayers: this.maxPlayers,
            salary: this.salary,
            initialMoney: this.initialMoney,
            private: this.password !== null,
            started: this.started,
            friendsOnly: this.friendsOnly,
        }
    }

    /**
     * Sorts the slots by their position.
     */
    @AfterLoad()
    sortSlots() {
        if(this.slots) {
            this.slots.sort((a, b) => a.position - b.position);
        }
    }
}