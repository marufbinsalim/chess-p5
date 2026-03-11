import type { GameState } from "../state/gameState";

/** The board shows white's pieces at the bottom when white is playing, and vice versa. */
export function getIsBoardReversed(state: GameState): boolean {
    return state.chess.getWhiteTurn();
}


/** get the current orientation of the board (white or black). */
export function getCurrentOrientation(state: GameState): boolean {
    return getIsBoardReversed(state);
}

/** Translate board coords → display coords based on current orientation. */
export function translateBoardCoords(
    state: GameState,
    x: number,
    y: number
): { x: number; y: number } {
    if (getCurrentOrientation(state)) {
        return { x: 7 - x, y: 7 - y };
    }
    return { x, y };
}

/** Translate screen coords → board coords based on current orientation. */
export function screenToBoardCoords(
    state: GameState,
    screenX: number,
    screenY: number,
    xOffset: number,
    yOffset: number,
    squareSize: number
): { x: number; y: number } {
    const boardX = Math.floor((screenX - xOffset) / squareSize);
    const boardY = Math.floor((screenY - yOffset) / squareSize);
    return translateBoardCoords(state, boardX, boardY);
}
