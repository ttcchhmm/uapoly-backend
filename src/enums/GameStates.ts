/**
 * An enum of all the possible states that can occur in the game.
 */
export enum GameStates {
    /**
     * Start of a new turn.
     */
    START_TURN = 'START_TURN',

    /**
     * The player is trying to escape jail.
     */
    TRY_ESCAPE_JAIL = 'TRY_ESCAPE_JAIL',

    /**
     * The player need to roll the dice.
     */
    ROLL_DICE = 'ROLL_DICE',

    /**
     * The player used a get out of jail card.
     */
    USE_OUT_OF_JAIL_CARD = 'USE_OUT_OF_JAIL_CARD',

    /**
     * The player paid the bail.
     */
    PAY_BAIL = 'PAY_BAIL',

    /**
     * End of turn.
     */
    END_TURN = 'END_TURN',

    /**
     * Move the player.
     */
    MOVE_PLAYER = 'MOVE_PLAYER',

    /**
     * The player passed go.
     */
    PASS_GO = 'PASS_GO',

    /**
     * The player landed on a slot.
     */
    LANDED_ON_SLOT = 'LANDED_ON_SLOT',

    /**
     * The player landed on a tax slot.
     */
    TAX = 'TAX',

    /**
     * The player landed on a free parking slot.
     */
    FREE_PARKING = 'FREE_PARKING',

    /**
     * The player landed on a go to jail slot.
     */
    GO_TO_JAIL = 'GO_TO_JAIL',

    /**
     * The player landed on a buyable slot.
     */
    BUYABLE_SLOT = 'BUYABLE_SLOT',

    /**
     * The player landed on an unowned slot.
     */
    UNOWNED_SLOT = 'UNOWNED_SLOT',

    /**
     * The player landed on an owned slot.
     */
    OWNED_SLOT = 'OWNED_SLOT',

    /**
     * Pay rent to the owner of the slot.
     */
    PAY_RENT = 'PAY_RENT',

    /**
     * Ask the player if they want to buy the property.
     */
    ASK_BUY_PROPERTY = 'ASK_BUY_PROPERTY',

    /**
     * The player chose to buy the property.
     */
    BUY_PROPERTY = 'BUY_PROPERTY',

    /**
     * The player landed on start.
     */
    GO = 'GO',

    /**
     * The player landed on a Chance or Community Chest slot.
     */
    DRAW_CARD = 'DRAW_CARD',

    /**
     * The player need to pay.
     */
    PAY = 'PAY',

    /**
     * The player chose to manage their properties.
     */
    MANAGE_PROPERTIES = 'MANAGE_PROPERTIES',

    /**
     * The player chose to trade with another player.
     */
    TRADE = 'TRADE',

    /**
     * The player chose to declare bankruptcy.
     */
    DECLARE_BANKRUPTCY = 'DECLARE_BANKRUPTCY',

    /**
     * The game proceeds to the next player.
     */
    NEXT_PLAYER = 'NEXT_PLAYER',

    /**
     * The game ends.
     */
    END_GAME = 'END_GAME',

    /**
     * The player can afford to pay their debt.
     */
    CHECK_IF_PLAYER_CAN_AFFORD = 'CHECK_IF_PLAYER_CAN_AFFORD',

    /**
     * The player is in debt.
     */
    PLAYER_IN_DEBT = 'PLAYER_IN_DEBT',

    /**
     * Transfer money.
     */
    TRANSFER_MONEY = 'TRANSFER_MONEY',

    /**
     * Transfer money to the jackpot.
     */
    TRANSFER_MONEY_TO_JACKPOT = 'TRANSFER_MONEY_TO_JACKPOT',

    /**
     * Transfer money to a player.
     */
    TRANSFER_MONEY_TO_PLAYER = 'TRANSFER_MONEY_TO_PLAYER',

    /**
     * Transfer money to the bank.
     */
    TRANSFER_MONEY_TO_BANK = 'TRANSFER_MONEY_TO_BANK',
}