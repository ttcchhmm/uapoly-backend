import { Board } from "../entity/Board";
import { GameStates as States } from "./GameStates";
import { GameTransitions as Transitions } from "./GameTransitions";
import { StateMachine } from "../state/StateMachine";
import { State } from "../state/State";
import { writeFileSync } from "fs";
import { AppDataSource } from "../data-source";
import { Player } from "../entity/Player";
import { getIo } from "../socket/IoGlobal";
import { BuyableSlot } from "../entity/BuyableSlot";
import { BoardSlot } from "../entity/BoardSlot";
import { rollDices } from "./Dices";
import { CardSlot, CardStyle } from "../entity/CardSlot";
import { FreeParkingSlot } from "../entity/FreeParkingSlot";
import { GoToJailSlot } from "../entity/GoToJailSlot";
import { TaxSlot } from "../entity/TaxSlot";
import { Card } from "../defaults/CardsActions";
import { Slots } from "../defaults/Slots";
import { PropertySlot } from "../entity/PropertySlot";
import { TrainStationSlot } from "../entity/TrainStationSlot";
import { UtilitySlot } from "../entity/UtilitySlot";

const boardRepo = AppDataSource.getRepository(Board);
const playerRepo = AppDataSource.getRepository(Player);
const slotsRepo = AppDataSource.getRepository(BoardSlot);

/**
 * Additional data to pass to each transition function.
 */
export interface GameEvent {
    /**
     * The board the game is being played on.
     */
    board: Board;

    /**
     * If a payment is being made, the details of the payment. Undefined otherwise.
     */
    payment?: {
        /**
         * The player making the payment.
         */
        receiver: Player | 'bank' | 'jackpot',

        /**
         * The amount being paid.
         */
        amount: number,
    }
}

/**
 * Manage the state machines for each game.
 */
export class GameManager {
    /**
     * A map of all the games, with the game ID as the key.
     */
    games: Map<number, StateMachine<Transitions, States, GameEvent>>;

    /**
     * Start a new state machine for a game.
     * @param board The board to start the game on.
     */
    startGame(board: Board) {
        this.games.set(board.id, GameManager.createMachine(board));
    }

    /**
     * Stop a game.
     * @param board The board the game was played on.
     * @param winner The winner of the game, or null if the game was aborted.
     */
    async stopGame(board: Board, winner: Player | null) {
        // Send the game over event
        getIo().to(`game-${board.id}`).emit("game-over", {
            gameId: board.id,
            winner: winner ? winner.accountLogin : null,
        });

        // Close the room
        getIo().in(`game-${board.id}`).socketsLeave(`game-${board.id}`);
        
        // Delete the game
        this.games.delete(board.id);
        await playerRepo.delete({ gameId: board.id });
        await slotsRepo.delete({ boardId: board.id });
        await boardRepo.remove(board);
    }

    /**
     * Get a state machine for a game.
     * @param game The game to get the state machine for.
     * @returns The state machine for the game.
     */
    getMachine(game: number | Board) {
        return this.games.get(typeof game === "number" ? game : game.id);
    }

    /**
     * Create a new state machine for a game.
     * @returns A new state machine for a game.
     */
    private static createMachine(board: Board): StateMachine<Transitions, States, GameEvent> {
        // TODO: Finish this
        // Not yet implemented : manage double rolls
        return new StateMachine<Transitions, States, GameEvent>(States.START_TURN, [
            new State<Transitions, States, GameEvent>(
                States.START_TURN,
                [Transitions.END_TURN],
                {
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                    [Transitions.IS_NOT_IN_JAIL]: States.ROLL_DICE,
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                },
                [startOfTurn],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.TRY_ESCAPE_JAIL,
                [Transitions.IS_IN_JAIL],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.ESCAPE_WITH_DICE]: States.ESCAPE_WITH_DICE,
                    [Transitions.PAY_BAIL]: States.PAY_BAIL,
                    [Transitions.USE_OUT_OF_JAIL_CARD]: States.USE_OUT_OF_JAIL_CARD,
                },
                [tryEscapeJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_BAIL,
                [Transitions.PAY_BAIL],
                {
                    [Transitions.PAY_BAIL]: States.PAY,
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                },
                [handlePayBail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.USE_OUT_OF_JAIL_CARD,
                [Transitions.USE_OUT_OF_JAIL_CARD],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE,
                    [Transitions.IS_IN_JAIL]: States.TRY_ESCAPE_JAIL,
                },
                [handleUseOutOfJailCard],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ESCAPE_WITH_DICE,
                [Transitions.ESCAPE_WITH_DICE],
                {
                    [Transitions.ROLL_DICE]: States.ROLL_DICE, // Success
                    [Transitions.END_TURN]: States.END_TURN, // Failure
                },
                [handleEscapeWithDice],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.ROLL_DICE,
                [Transitions.ROLL_DICE],
                {
                    [Transitions.MOVED_PLAYER]: States.LANDED_ON_SLOT,
                    [Transitions.PASS_START]: States.LANDED_ON_SLOT,
                },
                [],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.LANDED_ON_SLOT,
                [Transitions.MOVED_PLAYER],
                {
                    [Transitions.LAND_ON_BUYABLE]: States.BUYABLE_SLOT,
                    [Transitions.LAND_ON_FREE_PARKING]: States.FREE_PARKING,
                    [Transitions.LAND_ON_GO_TO_JAIL]: States.GO_TO_JAIL,
                    [Transitions.LAND_ON_TAX]: States.TAX,
                    [Transitions.LAND_ON_START]: States.GO,
                    [Transitions.LAND_ON_REST]: States.END_TURN,
                    [Transitions.LAND_ON_DRAW_CARD]: States.DRAW_CARD,
                },
                [handleLanding],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO_TO_JAIL,
                [Transitions.LAND_ON_GO_TO_JAIL, Transitions.DREW_GO_TO_JAIL_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleGoToJail],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUYABLE_SLOT,
                [Transitions.LAND_ON_BUYABLE],
                {
                    [Transitions.NOT_BOUGHT]: States.UNOWNED_SLOT,
                    [Transitions.BOUGHT]: States.OWNED_SLOT,
                },
                [handleLandedOnBuyableSlot],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.UNOWNED_SLOT,
                [Transitions.NOT_BOUGHT],
                {
                    [Transitions.BUY_PROPERTY]: States.BUY_PROPERTY,
                    [Transitions.DO_NOT_BUY_PROPERTY]: States.END_TURN,
                },
                [handleBuyingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.BUY_PROPERTY,
                [Transitions.BUY_PROPERTY],
                {
                    [Transitions.PAY_BANK]: States.PAY
                },
                [handlePayingProperty],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.OWNED_SLOT,
                [Transitions.BOUGHT],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.OWNER_NOT_IN_JAIL]: States.PAY_RENT,
                },
                [handleJailRentCheck],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.PAY_RENT,
                [Transitions.OWNER_NOT_IN_JAIL],
                {
                    [Transitions.PAY_PLAYER]: States.PAY,
                },
                [handleRent],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.FREE_PARKING,
                [Transitions.LAND_ON_FREE_PARKING],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleFreeParking],
                [],
            ),

            new State<Transitions, States, GameEvent>(
                States.TAX,
                [Transitions.LAND_ON_TAX],
                {
                    [Transitions.PAY_BANK]: States.PAY,
                },
                [handlePayTax],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.GO,
                [Transitions.LAND_ON_START],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleGo],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DRAW_CARD,
                [Transitions.LAND_ON_DRAW_CARD],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                    [Transitions.DREW_GO_TO_JAIL_CARD]: States.GO_TO_JAIL,
                    [Transitions.MOVED_PLAYER]: States.LANDED_ON_SLOT,
                },
                [handleDrawCard],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.END_TURN,
                [Transitions.END_TURN, Transitions.DECLARE_BANKRUPTCY],
                {
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                    [Transitions.MANAGE_PROPERTIES]: States.MANAGE_PROPERTIES,
                    [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                    [Transitions.TRADE]: States.TRADE,
                },
                [handleEndTurn],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.NEXT_PLAYER,
                [Transitions.NEXT_PLAYER],
                {
                    [Transitions.NEXT_TURN]: States.START_TURN,
                    [Transitions.GAME_OVER]: States.END_GAME,
                },
                [handleNextPlayer],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.DECLARE_BANKRUPTCY,
                [Transitions.DECLARE_BANKRUPTCY],
                {
                    [Transitions.NEXT_PLAYER]: States.NEXT_PLAYER,
                },
                [handleDeclareBankruptcy],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.MANAGE_PROPERTIES,
                [Transitions.MANAGE_PROPERTIES],
                {
                    [Transitions.END_TURN]: States.END_TURN,
                },
                [handleManageProperties],
                []
            ),

            new State<Transitions, States, GameEvent>(
                States.END_GAME,
                [Transitions.GAME_OVER],
                {},
                [handleGameOver],
                []
            ),

            new StateMachine<Transitions, States, GameEvent>(
                States.TRADE,
                [
                    new State<Transitions, States, GameEvent>(
                        States.TRADE,
                        [Transitions.TRADE],
                        {
                            [Transitions.ACCEPTED_TRADE]: States.TRADE_ACCEPTED,
                            [Transitions.END_TURN]: States.END_TURN,
                            [Transitions.CONTINUE]: States.PAY,
                        },
                        [handleTrade],
                        []
                    ),

                    new State<Transitions, States, GameEvent>(
                        States.TRADE_ACCEPTED,
                        [Transitions.ACCEPTED_TRADE],
                        {
                            [Transitions.END_TURN]: States.END_TURN,
                            [Transitions.CONTINUE]: States.PAY,
                        },
                        [handleTradeAccepted],
                        []
                    ),
                ],
                false,
                {
                    name: States.TRADE,
                    inTransitions: [
                        Transitions.TRADE,
                    ],
                    outTransitions: {
                        [Transitions.END_TURN]: States.END_TURN,
                        [Transitions.CONTINUE]: States.PAY,
                    }
                },
            ),

            new StateMachine<Transitions, States, GameEvent>(
                States.CHECK_IF_PLAYER_CAN_AFFORD,
                [
                    new State<Transitions, States, GameEvent>(
                        States.PLAYER_IN_DEBT,
                        [Transitions.CANNOT_PAY],
                        {
                            [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                            [Transitions.TRADE]: States.TRADE,
                            [Transitions.MANAGE_PROPERTIES]: States.MANAGE_PROPERTIES,
                            [Transitions.CAN_PAY]: States.TRANSFER_MONEY,
                        },
                        [handlePlayerInDebt],
                        []
                    ),
                    
                    new State<Transitions, States, GameEvent>(
                        States.CHECK_IF_PLAYER_CAN_AFFORD,
                        [
                            Transitions.PAY_BAIL,
                            Transitions.PAY_BANK,
                            Transitions.PAY_PLAYER,
                        ],
                        {
                            [Transitions.CAN_PAY]: States.TRANSFER_MONEY,
                            [Transitions.CANNOT_PAY]: States.PLAYER_IN_DEBT,
                        },
                        [handleCheckIfPlayerCanAfford],
                        []
                    ),
                ],
                false,
                {
                    name: States.PAY,
                    outTransitions: {
                        [Transitions.DECLARE_BANKRUPTCY]: States.DECLARE_BANKRUPTCY,
                        [Transitions.END_TURN]: States.END_TURN,
                        [Transitions.PAY_BAIL]: States.ROLL_DICE,
                    },
                    inTransitions: [
                        Transitions.PAY_BAIL,
                        Transitions.PAY_BANK,
                        Transitions.PAY_PLAYER,
                    ]
                }
            ),
        ], false, undefined, { board });
    }

    /**
     * Dump a graph of the state machine to a file.
     * @param filename The filename to write the graph to.
     */
    static dumpMachineGraph(filename: string) {
        writeFileSync(filename, this.createMachine(null).generateDot());
    }
}

/**
 * Function executed each time the "start of turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function startOfTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

    if(player.money <= 0) {
        currentMachine.transition(Transitions.NEXT_PLAYER, additionalData);
    } else {
        getIo().to(`game-${additionalData.board.id}`).emit('startOfTurn', {
            gameId: additionalData.board.id,
            accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
        });

        if(player.inJail) {
            currentMachine.transition(Transitions.IS_IN_JAIL, additionalData);
        } else {
            currentMachine.transition(Transitions.IS_NOT_IN_JAIL, additionalData);
        }
    }
}

/**
 * Function executed each time the "try escape jail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function tryEscapeJail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    getIo().to(`game-${additionalData.board.id}`).emit('tryEscapeJail', {
        gameId: additionalData.board.id,
        accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex].accountLogin,
    });
}

/**
 * Function executed each time the "landed on slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLanding(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];

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
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function endTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on buyable slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleLandedOnBuyableSlot(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    const slot = additionalData.board.slots[player.currentSlotIndex];

    if(slot instanceof BuyableSlot && slot.owner) {
        currentMachine.transition(Transitions.BOUGHT, additionalData);
    } else {
        currentMachine.transition(Transitions.NOT_BOUGHT, additionalData);
    }
}

/**
 * Function executed each time the "buy property" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleBuyingProperty(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "landed on bought slot" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleJailRentCheck(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    const slot = additionalData.board.slots[player.currentSlotIndex];

    if(slot instanceof BuyableSlot && slot.owner.inJail) {
        currentMachine.transition(Transitions.END_TURN, additionalData);
    } else {
        currentMachine.transition(Transitions.OWNER_NOT_IN_JAIL, additionalData);
    }
}

/**
 * Function executed each time the "Free Parking" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleFreeParking(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    player.money += additionalData.board.jackpot;

    additionalData.board.jackpot = 0;
    await Promise.all([
        playerRepo.save(player),
        boardRepo.save(additionalData.board),
    ]);

    getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
    currentMachine.transition(Transitions.END_TURN, additionalData);
}

/**
 * Function executed each time the "landed on Go" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleGo(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    player.money += additionalData.board.salary;

    await playerRepo.save(player);

    getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
    currentMachine.transition(Transitions.END_TURN, additionalData);
}

/**
 * Function executed each time the "landed on Draw Card" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleDrawCard(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    const slot = additionalData.board.slots[player.currentSlotIndex];
    
    if(slot instanceof CardSlot) {
        let deck: Card[];

        switch(slot.cardStyle) {
            case CardStyle.CHANCE:
                deck = Slots.get(additionalData.board.locale).deck.chance;
                break;

            case CardStyle.COMMUNITY:
                deck = Slots.get(additionalData.board.locale).deck.communityChest;
                break;
        }

        const card = deck[Math.floor(Math.random() * deck.length)];

        getIo().to(`game-${additionalData.board.id}`).emit('cardDrawn', {
            gameId: additionalData.board.id,
            accountLogin: player.accountLogin,
            description: card.description,
        });

        await card.action(currentMachine, player);
    }
}

/**
 * Function executed each time the "Go To Jail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleGoToJail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    player.inJail = true;
    player.currentSlotIndex = additionalData.board.jailSlotIndex;
    await playerRepo.save(player);

    getIo().to(`game-${additionalData.board.id}`).emit('update', additionalData.board);
    currentMachine.transition(Transitions.END_TURN, additionalData);
}

/**
 * Function executed each time the "end turn" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleEndTurn(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    getIo().to(`game-${additionalData.board.id}`).emit('endOfTurn', {
        gameId: additionalData.board.id,
        accountLogin: additionalData.board.players[additionalData.board.currentPlayerIndex],
    });
}

/**
 * Function executed each time the "next player" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleNextPlayer(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
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
}

/**
 * Function executed each time the "declare bankruptcy" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleDeclareBankruptcy(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    await additionalData.board.players[additionalData.board.currentPlayerIndex].bankrupt();
    currentMachine.transition(Transitions.NEXT_PLAYER, additionalData);
}

/**
 * Function executed each time the "manage properties" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleManageProperties(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "trade" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleTrade(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay bail" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayBail(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    currentMachine.transition(Transitions.PAY_BANK, {
        payment: {
            amount: 50,
            receiver: 'bank',
        },

        ...additionalData,
    });
}

/**
 * Function executed each time the "use out of jail card" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleUseOutOfJailCard(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    if(player.outOfJailCards > 0) {
        player.outOfJailCards--;
        player.inJail = false;

        await playerRepo.save(player);

        currentMachine.transition(Transitions.ROLL_DICE, additionalData);
    } else {
        currentMachine.transition(Transitions.IS_IN_JAIL, additionalData);
    }
}

/**
 * Function executed each time the "try escape with dice" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
async function handleEscapeWithDice(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const player = additionalData.board.players[additionalData.board.currentPlayerIndex];
    const dices = rollDices(2);

    getIo().to(`game-${additionalData.board.id}`).emit('diceRoll', {
        gameId: additionalData.board.id,
        accountLogin: player.accountLogin,
        dices,
    });

    if(dices[0] === dices[1]) {
        player.inJail = false;

        await playerRepo.save(player);
        currentMachine.transition(Transitions.ROLL_DICE, additionalData);
    } else {
        currentMachine.transition(Transitions.END_TURN, additionalData);
    }
}

/**
 * Function executed each time the "player is in debt" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePlayerInDebt(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay property" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayingProperty(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "pay rent" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleRent(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
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
}

/**
 * Function executed each time the "pay tax" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handlePayTax(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "check if player can afford" state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleCheckIfPlayerCanAfford(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "trade accepted state is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleTradeAccepted(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    // TODO
}

/**
 * Function executed each time the "game over" is entered.
 * @param currentMachine The state machine used to represent the game.
 * @param upperMachine If the current state machine is embedded in another state machine, this is the parent state machine. Undefined otherwise.
 * @param event The event that triggered the transition.
 * @param additionalData Additional data passed with the event.
 */
function handleGameOver(currentMachine: StateMachine<Transitions, States, GameEvent>, upperMachine: StateMachine<Transitions, States, GameEvent> | undefined, event: Transitions, additionalData?: GameEvent) {
    const winner = additionalData.board.players.find(player => player.money > 0);
    Manager.stopGame(additionalData.board, winner);
}

/**
 * The game manager.
 */
export const Manager = new GameManager();