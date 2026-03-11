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
            case Chess.PIECES.WHITE_KNIGHT: return "wN";
            case Chess.PIECES.WHITE_BISHOP: return "wB";
            case Chess.PIECES.WHITE_ROOK: return "wR";
            case Chess.PIECES.WHITE_QUEEN: return "wQ";
            case Chess.PIECES.WHITE_KING: return "wK";

            case Chess.PIECES.BLACK_PAWN: return "bP";
            case Chess.PIECES.BLACK_KNIGHT: return "bN";
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

    // Define move type that supports two-step moves like castling
    getAvailableMoves(x: number, y: number): Array<{
        x: number; 
        y: number; 
        secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined
    }> {
        const moves: Array<{
            x: number; 
            y: number; 
            secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined
        }> = [];
        const directions = [
            {dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
            {dx: -1, dy: 0},                     {dx: 1, dy: 0},
            {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}
        ];

        // Generate up to 4 random moves
        const numberOfMoves = Math.floor(Math.random() * 4) + 1;
        
        for (let i = 0; i < numberOfMoves; i++) {
            const dirIndex = Math.floor(Math.random() * directions.length);
            const dir = directions[dirIndex];
            if (dir) {
                const newX = x + dir.dx * (Math.floor(Math.random() * 3) + 1);
                const newY = y + dir.dy * (Math.floor(Math.random() * 3) + 1);
                
                if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                    // Randomly add a secondary move (simulating castling) for kings
                    const piece = this.board[x + y * 8];
                    let secondaryMove;
                    if (piece === Chess.PIECES.WHITE_KING || piece === Chess.PIECES.BLACK_KING) {
                        if (Math.random() < 0.3) { // 30% chance to add castling move
                            secondaryMove = {
                                fromX: newX === 6 ? 7 : 0, // Rook position based on king's destination
                                fromY: y,
                                toX: newX === 6 ? 5 : 3, // Rook destination for castling
                                toY: y
                            };
                        }
                    }
                    
                    moves.push({
                        x: newX, 
                        y: newY,
                        secondary: secondaryMove
                    });
                }
            }
        }

        return moves;
    }

    // Move a piece from (fromX, fromY) to (toX, toY), with optional secondary move
    movePiece(fromX: number, fromY: number, toX: number, toY: number, secondary?: {fromX: number, fromY: number, toX: number, toY: number}) {
        const piece = this.board[fromX + fromY * 8];
        if (piece !== undefined) {
            this.board[fromX + fromY * 8] = Chess.PIECES.EMPTY;
            this.board[toX + toY * 8] = piece;
        }
        
        // Handle secondary move if present (e.g., rook move during castling)
        if (secondary) {
            const secondaryPiece = this.board[secondary.fromX + secondary.fromY * 8];
            if (secondaryPiece !== undefined) {
                this.board[secondary.fromX + secondary.fromY * 8] = Chess.PIECES.EMPTY;
                this.board[secondary.toX + secondary.toY * 8] = secondaryPiece;
            }
        }
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