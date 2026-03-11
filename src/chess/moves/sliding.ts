import type { Move } from "../moveTypes";
import { canMoveTo, isSquareOccupied, isValidPosition } from "../boardUtils";

function addSlidingMoves(
    board: number[],
    x: number,
    y: number,
    isWhite: boolean,
    directions: { dx: number; dy: number }[],
    moves: Move[]
): void {
    for (const { dx, dy } of directions) {
        let newX = x + dx;
        let newY = y + dy;
        while (isValidPosition(newX, newY)) {
            if (!isSquareOccupied(board, newX, newY)) {
                moves.push({ x: newX, y: newY });
            } else {
                if (canMoveTo(board, newX, newY, isWhite)) {
                    moves.push({ x: newX, y: newY });
                }
                break; // Blocked by a piece
            }
            newX += dx;
            newY += dy;
        }
    }
}

const BISHOP_DIRECTIONS = [
    { dx: -1, dy: -1 }, { dx: 1, dy:  1 },
    { dx:  1, dy: -1 }, { dx: -1, dy:  1 },
];

const ROOK_DIRECTIONS = [
    { dx: 0, dy: -1 }, { dx:  0, dy: 1 },
    { dx: -1, dy: 0 }, { dx:  1, dy: 0 },
];

export function addBishopMoves(board: number[], x: number, y: number, isWhite: boolean, moves: Move[]): void {
    addSlidingMoves(board, x, y, isWhite, BISHOP_DIRECTIONS, moves);
}

export function addRookMoves(board: number[], x: number, y: number, isWhite: boolean, moves: Move[]): void {
    addSlidingMoves(board, x, y, isWhite, ROOK_DIRECTIONS, moves);
}

export function addQueenMoves(board: number[], x: number, y: number, isWhite: boolean, moves: Move[]): void {
    addSlidingMoves(board, x, y, isWhite, [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS], moves);
}
