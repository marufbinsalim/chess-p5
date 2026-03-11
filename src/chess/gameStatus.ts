import { PIECES } from "./pieces";
import { isWhitePiece, isBlackPiece } from "./pieces";
import { getPieceAt } from "./boardUtils";
import type { Move } from "./moveTypes";

type GetAvailableMovesFn = (x: number, y: number) => Move[];
type PieceAttacksSquareFn = (fromX: number, fromY: number, toX: number, toY: number) => boolean;

export function isInCheck(
    board: number[],
    isWhite: boolean,
    kingPos: { x: number; y: number },
    pieceAttacksSquare: PieceAttacksSquareFn
): boolean {
    const opponentPieces = isWhite ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = getPieceAt(board, x, y);
            if (opponentPieces.includes(piece) && pieceAttacksSquare(x, y, kingPos.x, kingPos.y)) {
                return true;
            }
        }
    }
    return false;
}

export function isSquareAttacked(
    board: number[],
    x: number,
    y: number,
    isWhite: boolean,
    pieceAttacksSquare: PieceAttacksSquareFn
): boolean {
    const opponentPieces = isWhite ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6];

    for (let oy = 0; oy < 8; oy++) {
        for (let ox = 0; ox < 8; ox++) {
            const piece = getPieceAt(board, ox, oy);
            if (opponentPieces.includes(piece) && pieceAttacksSquare(ox, oy, x, y)) {
                return true;
            }
        }
    }
    return false;
}

/** Returns true if the current player has no legal moves and is in check. */
export function isCheckmate(
    board: number[],
    isWhiteTurn: boolean,
    checkInCheck: (isWhite: boolean) => boolean,
    getAvailableMoves: GetAvailableMovesFn
): boolean {
    if (!checkInCheck(isWhiteTurn)) return false;
    return hasNoLegalMoves(board, isWhiteTurn, getAvailableMoves);
}

/** Returns true if the current player has no legal moves and is NOT in check. */
export function isStalemate(
    board: number[],
    isWhiteTurn: boolean,
    checkInCheck: (isWhite: boolean) => boolean,
    getAvailableMoves: GetAvailableMovesFn
): boolean {
    if (checkInCheck(isWhiteTurn)) return false;
    return hasNoLegalMoves(board, isWhiteTurn, getAvailableMoves);
}

function hasNoLegalMoves(
    board: number[],
    isWhiteTurn: boolean,
    getAvailableMoves: GetAvailableMovesFn
): boolean {
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = getPieceAt(board, x, y);
            const belongsToCurrentPlayer =
                (isWhiteTurn && isWhitePiece(piece)) ||
                (!isWhiteTurn && isBlackPiece(piece));
            if (belongsToCurrentPlayer && getAvailableMoves(x, y).length > 0) {
                return false;
            }
        }
    }
    return true;
}

/** Returns true when the position is a theoretical draw (insufficient material or 50-move rule). */
export function isDraw(board: number[], halfMoveClock: number): boolean {
    if (halfMoveClock >= 100) return true;

    const whitePieces: number[] = [];
    const blackPieces: number[] = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = getPieceAt(board, x, y);
            if (piece !== PIECES.EMPTY) {
                if (isWhitePiece(piece)) whitePieces.push(piece);
                else blackPieces.push(piece);
            }
        }
    }

    // King vs King
    if (whitePieces.length === 1 && blackPieces.length === 1) return true;

    // King + minor piece vs lone King
    const isMinorDraw = (side: number[], minor: number, opponent: number[]) =>
        side.length === 2 &&
        side.includes(minor) &&
        !side.includes(minor === PIECES.WHITE_BISHOP ? PIECES.WHITE_PAWN : PIECES.BLACK_PAWN) &&
        opponent.length === 1;

    if (isMinorDraw(whitePieces, PIECES.WHITE_BISHOP, blackPieces)) return true;
    if (isMinorDraw(blackPieces, PIECES.BLACK_BISHOP, whitePieces)) return true;
    if (isMinorDraw(whitePieces, PIECES.WHITE_KNIGHT, blackPieces)) return true;
    if (isMinorDraw(blackPieces, PIECES.BLACK_KNIGHT, whitePieces)) return true;

    return false;
}
