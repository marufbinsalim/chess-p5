export const PIECES = {
    EMPTY: 0,

    WHITE_PAWN: 1,
    WHITE_KNIGHT: 2,
    WHITE_BISHOP: 3,
    WHITE_ROOK: 4,
    WHITE_QUEEN: 5,
    WHITE_KING: 6,

    BLACK_PAWN: 7,
    BLACK_KNIGHT: 8,
    BLACK_BISHOP: 9,
    BLACK_ROOK: 10,
    BLACK_QUEEN: 11,
    BLACK_KING: 12,
} as const;

export type PieceValue = typeof PIECES[keyof typeof PIECES];

export function getPieceName(piece: number): string {
    switch (piece) {
        case PIECES.WHITE_PAWN:   return "wP";
        case PIECES.WHITE_KNIGHT: return "wN";
        case PIECES.WHITE_BISHOP: return "wB";
        case PIECES.WHITE_ROOK:   return "wR";
        case PIECES.WHITE_QUEEN:  return "wQ";
        case PIECES.WHITE_KING:   return "wK";
        case PIECES.BLACK_PAWN:   return "bP";
        case PIECES.BLACK_KNIGHT: return "bN";
        case PIECES.BLACK_BISHOP: return "bB";
        case PIECES.BLACK_ROOK:   return "bR";
        case PIECES.BLACK_QUEEN:  return "bQ";
        case PIECES.BLACK_KING:   return "bK";
        default:                  return "EMPTY";
    }
}

export function isWhitePiece(piece: number): boolean {
    return piece >= PIECES.WHITE_PAWN && piece <= PIECES.WHITE_KING;
}

export function isBlackPiece(piece: number): boolean {
    return piece >= PIECES.BLACK_PAWN && piece <= PIECES.BLACK_KING;
}
