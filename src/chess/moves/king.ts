import type { Move } from "../moveTypes";
import { canMoveTo, isSquareOccupied } from "../boardUtils";

const KING_DIRECTIONS = [
    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy:  0 },                     { dx: 1, dy:  0 },
    { dx: -1, dy:  1 }, { dx: 0, dy:  1 }, { dx: 1, dy:  1 },
];

export interface CastlingRights {
    whiteCastleKingside: boolean;
    whiteCastleQueenside: boolean;
    blackCastleKingside: boolean;
    blackCastleQueenside: boolean;
}

type IsSquareAttackedFn = (x: number, y: number, isWhite: boolean) => boolean;
type IsInCheckFn = (isWhite: boolean) => boolean;

export function addKingMoves(
    board: number[],
    x: number,
    y: number,
    isWhite: boolean,
    castlingRights: CastlingRights,
    isInCheck: IsInCheckFn,
    isSquareAttacked: IsSquareAttackedFn,
    moves: Move[],
    isAttackCheck: boolean = false
): void {
    for (const { dx, dy } of KING_DIRECTIONS) {
        const newX = x + dx;
        const newY = y + dy;
        if (canMoveTo(board, newX, newY, isWhite)) {
            moves.push({ x: newX, y: newY });
        }
    }

    if (!isAttackCheck && !isInCheck(isWhite)) {
        addCastlingMoves(board, isWhite, castlingRights, isSquareAttacked, moves);
    }
}

function addCastlingMoves(
    board: number[],
    isWhite: boolean,
    rights: CastlingRights,
    isSquareAttacked: IsSquareAttackedFn,
    moves: Move[]
): void {
    const row = isWhite ? 0 : 7;
    const kingsideClear = !isSquareOccupied(board, 5, row) && !isSquareOccupied(board, 6, row);
    const queensideClear =
        !isSquareOccupied(board, 3, row) &&
        !isSquareOccupied(board, 2, row) &&
        !isSquareOccupied(board, 1, row);

    const canKingside = isWhite ? rights.whiteCastleKingside : rights.blackCastleKingside;
    const canQueenside = isWhite ? rights.whiteCastleQueenside : rights.blackCastleQueenside;

    if (canKingside && kingsideClear) {
        if (!isSquareAttacked(5, row, isWhite) && !isSquareAttacked(6, row, isWhite)) {
            moves.push({ x: 6, y: row, secondary: { fromX: 7, fromY: row, toX: 5, toY: row } });
        }
    }

    if (canQueenside && queensideClear) {
        if (!isSquareAttacked(3, row, isWhite) && !isSquareAttacked(2, row, isWhite)) {
            moves.push({ x: 2, y: row, secondary: { fromX: 0, fromY: row, toX: 3, toY: row } });
        }
    }
}
