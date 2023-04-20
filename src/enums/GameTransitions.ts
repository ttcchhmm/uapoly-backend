/**
 * An enum of all the possible transitions that can occur in the game.
 */
export enum GameTransitions {
    /**
     * The player is in jail.
     */
    IS_IN_JAIL = 'IS_IN_JAIL',

    /**
     * The player is not in jail.
     */
    IS_NOT_IN_JAIL = 'IS_NOT_IN_JAIL',

    /**
     * The player rolled the dice.
     */
    ROLL_DICE = 'ROLL_DICE',

    /**
     * The player passed start.
     */
    PASS_START = 'PASS_START',

    /**
     * The player moved.
     */
    MOVED_PLAYER = 'MOVED_PLAYER',

    /**
     * The player landed on a buyable slot.
     */
    LAND_ON_BUYABLE = 'LAND_ON_BUYABLE',

    /**
     * The player landed on an unowned slot.
     */
    NOT_BOUGHT = 'NOT_BOUGHT',

    /**
     * The player landed on an owned slot.
     */
    BOUGHT = 'BOUGHT',

    /**
     * The owner of the slot is not in jail.
     */
    OWNER_NOT_IN_JAIL = 'OWNER_NOT_IN_JAIL',

    /**
     * The player chose to buy the property.
     */
    BUY_PROPERTY = 'BUY_PROPERTY',

    /**
     * The player chose not to buy the property.
     */
    DO_NOT_BUY_PROPERTY = 'DO_NOT_BUY_PROPERTY',

    /**
     * The player landed on the Free Parking slot.
     */
    LAND_ON_FREE_PARKING = 'LAND_ON_FREE_PARKING',

    /**
     * The player landed on the Go To Jail slot.
     */
    LAND_ON_GO_TO_JAIL = 'LAND_ON_GO_TO_JAIL',

    /**
     * The player landed on a tax slot.
     */
    LAND_ON_TAX = 'LAND_ON_TAX',

    /**
     * The player landed on the Go slot.
     */
    LAND_ON_START = 'LAND_ON_START',

    /**
     * The player landed on a rest slot (such as Just Visiting)
     */
    LAND_ON_REST = 'LAND_ON_REST',

    /**
     * The player chose to trade with another player.
     */
    TRADE = 'TRADE',

    /**
     * The player chose to accept a trade.
     */
    ACCEPTED_TRADE = 'ACCEPTED_TRADE',

    /**
     * The player chose to reject a trade.
     */
    REJECTED_TRADE = 'REJECTED_TRADE',

    /**
     * Continue the game.
     */
    CONTINUE = 'CONTINUE',

    /**
     * The player can pay its debt.
     */
    CAN_PAY = 'CAN_PAY',

    /**
     * The player cannot pay its debt.
     */
    CANNOT_PAY = 'CANNOT_PAY',

    /**
     * The player chose to declare bankruptcy.
     */
    DECLARE_BANKRUPTCY = 'DECLARE_BANKRUPTCY',

    /**
     * The player chose to manage its properties (such as building or mortgaging).
     */
    MANAGE_PROPERTIES = 'MANAGE_PROPERTIES',

    /**
     * The amont of money the player has to pay will contribute to the jackpot.
     */
    CONTRIBUTE_JACKPOT = 'CONTRIBUTE_JACKPOT',

    /**
     * The player need to pay the bank.
     */
    PAY_BANK = 'PAY_BANK',

    /**
     * The player need to pay another player.
     */
    PAY_PLAYER = 'PAY_PLAYER',

    /**
     * End of turn.
     */
    END_TURN = 'END_TURN',

    /**
     * The player rolled a double.
     */
    DOUBLE_ROLL = 'DOUBLE_ROLL',

    /**
     * The player did not roll a double.
     */
    NOT_DOUBLE_ROLL = 'NOT_DOUBLE_ROLL',

    /**
     * The player drew a "Go to Jail" card.
     */
    DREW_GO_TO_JAIL_CARD = 'DREW_GO_TO_JAIL_CARD',
}