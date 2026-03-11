import { PIECES } from "./pieces";
import { isWhitePiece, isBlackPiece } from "./pieces";

export function getBoardIndex(x: number, y: number): number {
    return x + y * 8;
}

export function isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
}

export function getPieceAt(board: number[], x: number, y: number): number {
    return board[getBoardIndex(x, y)] ?? PIECES.EMPTY;
}

export function isSquareOccupied(board: number[], x: number, y: number): boolean {
    return getPieceAt(board, x, y) !== PIECES.EMPTY;
}

/** Returns true if the square can be moved to by a piece of `isWhite` colour. */
export function canMoveTo(board: number[], x: number, y: number, isWhite: boolean): boolean {
    if (!isValidPosition(x, y)) return false;
    const piece = getPieceAt(board, x, y);
    if (piece === PIECES.EMPTY) return true;
    return isWhite ? isBlackPiece(piece) : isWhitePiece(piece);
}
