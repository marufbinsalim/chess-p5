export class Chess {
    board: number[] = [];


    static PIECES = {
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
        BLACK_KING: 12
    }

    constructor() {
        this.resetBoard();
    }

    getPieceName(piece: number): string {
        switch (piece) {
            case Chess.PIECES.WHITE_PAWN: return "wP";
            case Chess.PIECES.WHITE_KNIGHT: return "wK";
            case Chess.PIECES.WHITE_BISHOP: return "wB";
            case Chess.PIECES.WHITE_ROOK: return "wR";
            case Chess.PIECES.WHITE_QUEEN: return "wQ";
            case Chess.PIECES.WHITE_KING: return "wK";

            case Chess.PIECES.BLACK_PAWN: return "bP";
            case Chess.PIECES.BLACK_KNIGHT: return "bK";
            case Chess.PIECES.BLACK_BISHOP: return "bB";
            case Chess.PIECES.BLACK_ROOK: return "bR";
            case Chess.PIECES.BLACK_QUEEN: return "bQ";
            case Chess.PIECES.BLACK_KING: return "bK";
            default: return "EMPTY";
        }
    }



    getPiece(x: number, y: number) {
        return this.getPieceName(this.board[x + y * 8] || 0);
    }

    resetBoard() {
        this.board = new Array(64).fill(Chess.PIECES.EMPTY);
        this.board[0] = Chess.PIECES.WHITE_ROOK
        this.board[1] = Chess.PIECES.WHITE_KNIGHT
        this.board[2] = Chess.PIECES.WHITE_BISHOP
        this.board[3] = Chess.PIECES.WHITE_QUEEN
        this.board[4] = Chess.PIECES.WHITE_KING
        this.board[5] = Chess.PIECES.WHITE_BISHOP
        this.board[6] = Chess.PIECES.WHITE_KNIGHT
        this.board[7] = Chess.PIECES.WHITE_ROOK

        for (let i = 8; i < 16; i++) this.board[i] = Chess.PIECES.WHITE_PAWN

        for (let i = 48; i < 56; i++) this.board[i] = Chess.PIECES.BLACK_PAWN

        this.board[56] = Chess.PIECES.BLACK_ROOK
        this.board[57] = Chess.PIECES.BLACK_KNIGHT
        this.board[58] = Chess.PIECES.BLACK_BISHOP
        this.board[59] = Chess.PIECES.BLACK_QUEEN
        this.board[60] = Chess.PIECES.BLACK_KING
        this.board[61] = Chess.PIECES.BLACK_BISHOP
        this.board[62] = Chess.PIECES.BLACK_KNIGHT
        this.board[63] = Chess.PIECES.BLACK_ROOK
    }
}