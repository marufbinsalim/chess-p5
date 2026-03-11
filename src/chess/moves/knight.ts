import type { Move } from "../moveTypes";
import { canMoveTo } from "../boardUtils";

const KNIGHT_OFFSETS = [
    { dx: -2, dy: -1 }, { dx: -2, dy: 1 },
    { dx:  2, dy: -1 }, { dx:  2, dy: 1 },
    { dx: -1, dy: -2 }, { dx: -1, dy: 2 },
    { dx:  1, dy: -2 }, { dx:  1, dy: 2 },
];

export function addKnightMoves(
    board: number[],
    x: number,
    y: number,
    isWhite: boolean,
    moves: Move[]
): void {
    for (const { dx, dy } of KNIGHT_OFFSETS) {
        const newX = x + dx;
        const newY = y + dy;
        if (canMoveTo(board, newX, newY, isWhite)) {
            moves.push({ x: newX, y: newY });
        }
    }
}
