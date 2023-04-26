/**
 * The state of a buyable slot.
 */
export const enum BuyableSlotState {
    /**
     * The slot is owned by a player.
     */
    OWNED,

    /**
     * The slot is mortgaged.
     */
    MORTGAGED,

    /**
     * The slot is available to be bought.
     */
    AVAILABLE
}