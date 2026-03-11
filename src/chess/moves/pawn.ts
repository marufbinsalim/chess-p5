import type { Move } from "../moveTypes";
import { canMoveTo, isSquareOccupied, isValidPosition } from "../boardUtils";

export function addPawnMoves(
    board: number[],
    x: number,
    y: number,
    isWhite: boolean,
    enPassantTarget: { x: number; y: number } | null,
    moves: Move[]
): void {
    const direction = isWhite ? 1 : -1;
    const startRow = isWhite ? 1 : 6;
    const promotionRow = isWhite ? 7 : 0;

    // Forward move
    if (canMoveTo(board, x, y + direction, isWhite) && !isSquareOccupied(board, x, y + direction)) {
        const move: Move = { x, y: y + direction };
        if (y + direction === promotionRow) move.promotion = true;
        moves.push(move);

        // Double move from start row
        if (
            y === startRow &&
            !isSquareOccupied(board, x, y + 2 * direction) &&
            canMoveTo(board, x, y + 2 * direction, isWhite)
        ) {
            moves.push({ x, y: y + 2 * direction });
        }
    }

    // Diagonal captures + en passant
    for (const dx of [-1, 1]) {
        const newX = x + dx;
        const newY = y + direction;
        if (!isValidPosition(newX, newY)) continue;

        const isRegularCapture = isSquareOccupied(board, newX, newY) && canMoveTo(board, newX, newY, isWhite);
        const isEnPassant = enPassantTarget?.x === newX && enPassantTarget?.y === newY;

        if (isRegularCapture || isEnPassant) {
            const move: Move = { x: newX, y: newY };
            if (newY === promotionRow) move.promotion = true;
            moves.push(move);
        }
    }
}
