import { Board } from "../entity/Board";

/**
 * Represents a live game.
 */
export class Game {
    /**
     * The board representing the game.
     */
    board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    /**
     * Plays a turn.
     */
    play(): void {
        if(!this.board.started) {
            return;
        }

        // Get the current player
        const currentPlayer = this.board.players[this.board.currentPlayerIndex];

        // Check if the player has lost
        if(currentPlayer.money <= 0) {
            this.nextTurn();
            return;
        }

        if(currentPlayer.inJail) {
            // TODO: Handle jail
        }

        // TODO : Roll the dice

        // TODO: Move the player

        // TODO: Handle where the player lands

        // TODO: Handle end of turn actions

        this.nextTurn()
    }

    /**
     * Handle the "switching to next turn" logic.
     */
    nextTurn() {
        // Check if the game is over
        if(this.board.players.reduce((acc, player) => { // Count the number of players with money
            if(player.money <= 0) {
                return acc;
            } else {
                return acc + 1;
            }
        }, 0) === 1) {
            // TODO: Handle end of game
        } else { // If the game is not over
            // Next player
            if(this.board.players.length === this.board.currentPlayerIndex - 1) {
                this.board.currentPlayerIndex = 0;
            } else {
                this.board.currentPlayerIndex++;
            }

            // Next turn
            this.play();
        }
    }
}