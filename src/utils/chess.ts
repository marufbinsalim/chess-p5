export class Chess {
    board: number[] = [];
    whiteKingPosition = { x: 4, y: 0 };
    blackKingPosition = { x: 4, y: 7 };
    whiteCastleKingside = true;
    whiteCastleQueenside = true;
    blackCastleKingside = true;
    blackCastleQueenside = true;
    enPassantTarget: { x: number; y: number } | null = null;
    halfMoveClock = 0;
    fullMoveNumber = 1;

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

    private whiteTurn: boolean = true;

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

    isWhite(piece: number): boolean {
        return piece >= Chess.PIECES.WHITE_PAWN && piece <= Chess.PIECES.WHITE_KING;
    }

    isBlack(piece: number): boolean {
        return piece >= Chess.PIECES.BLACK_PAWN && piece <= Chess.PIECES.BLACK_KING;
    }

    isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    getBoardIndex(x: number, y: number): number {
        return x + y * 8;
    }

    isSquareOccupied(x: number, y: number): boolean {
        return this.board[this.getBoardIndex(x, y)] !== Chess.PIECES.EMPTY;
    }

    getPieceAt(x: number, y: number): number {
        return this.board[this.getBoardIndex(x, y)] || Chess.PIECES.EMPTY;
    }

    canMoveTo(x: number, y: number, isWhite: boolean): boolean {
        if (!this.isValidPosition(x, y)) return false;
        const piece = this.getPieceAt(x, y);
        if (piece === Chess.PIECES.EMPTY) return true;
        return isWhite ? this.isBlack(piece) : this.isWhite(piece);
    }

    isInCheck(isWhite: boolean): boolean {
        const kingPos = isWhite ? this.whiteKingPosition : this.blackKingPosition;
        const opponentPieces = isWhite 
            ? [7, 8, 9, 10, 11, 12] 
            : [1, 2, 3, 4, 5, 6];

        // Check all opponent pieces for attacks on king
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = this.getPieceAt(x, y);
                if (opponentPieces.includes(piece)) {
                    if (this.pieceAttacksSquare(x, y, kingPos.x, kingPos.y)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    pieceAttacksSquare(fromX: number, fromY: number, toX: number, toY: number): boolean {
        const piece = this.getPieceAt(fromX, fromY);
        const moves = this.getPieceMoves(fromX, fromY, piece, true, true);
        return moves.some(move => move.x === toX && move.y === toY);
    }

    getPieceMoves(x: number, y: number, piece: number, includeInvalid: boolean = true, isAttackCheck: boolean = false): Array<{
        x: number; 
        y: number; 
        secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined;
        promotion?: boolean;
    }> {
        const moves: Array<{
            x: number; 
            y: number; 
            secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined;
            promotion?: boolean;
        }> = [];
        const isWhite = this.isWhite(piece);
        if(this.whiteTurn && !isWhite) return moves;
        if(!this.whiteTurn && isWhite) return moves;

        switch (piece) {
            case Chess.PIECES.WHITE_PAWN:
            case Chess.PIECES.BLACK_PAWN:
                this.addPawnMoves(x, y, isWhite, moves);
                break;
            case Chess.PIECES.WHITE_KNIGHT:
            case Chess.PIECES.BLACK_KNIGHT:
                this.addKnightMoves(x, y, isWhite, moves);
                break;
            case Chess.PIECES.WHITE_BISHOP:
            case Chess.PIECES.BLACK_BISHOP:
                this.addBishopMoves(x, y, isWhite, moves);
                break;
            case Chess.PIECES.WHITE_ROOK:
            case Chess.PIECES.BLACK_ROOK:
                this.addRookMoves(x, y, isWhite, moves);
                break;
            case Chess.PIECES.WHITE_QUEEN:
            case Chess.PIECES.BLACK_QUEEN:
                this.addQueenMoves(x, y, isWhite, moves);
                break;
            case Chess.PIECES.WHITE_KING:
            case Chess.PIECES.BLACK_KING:
                this.addKingMoves(x, y, isWhite, moves, isAttackCheck);
                break;
        }

        if (includeInvalid) {
            return moves;
        }

        // Filter out moves that put own king in check
        return moves.filter(move => this.isMoveValid(x, y, move.x, move.y, move.secondary));
    }

    addPawnMoves(x: number, y: number, isWhite: boolean, moves: Array<{
        x: number; 
        y: number; 
        secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined;
        promotion?: boolean;
    }>): void {
        const direction = isWhite ? 1 : -1;
        const startRow = isWhite ? 1 : 6;
        const promotionRow = isWhite ? 7 : 0;

        // Forward move
        if (this.canMoveTo(x, y + direction, isWhite) && !this.isSquareOccupied(x, y + direction)) {
            const move: any = { x, y: y + direction };
            if (y + direction === promotionRow) {
                move.promotion = true;
            }
            moves.push(move);
            // Double move from start
            if (y === startRow && !this.isSquareOccupied(x, y + 2 * direction) && this.canMoveTo(x, y + 2 * direction, isWhite)) {
                moves.push({ x, y: y + 2 * direction });
            }
        }

        // Captures
        for (const dx of [-1, 1]) {
            const newX = x + dx;
            const newY = y + direction;
            if (this.isValidPosition(newX, newY)) {
                // Regular capture
                if (this.isSquareOccupied(newX, newY) && this.canMoveTo(newX, newY, isWhite)) {
                    const move: any = { x: newX, y: newY };
                    if (newY === promotionRow) {
                        move.promotion = true;
                    }
                    moves.push(move);
                }
                // En passant
                if (this.enPassantTarget && this.enPassantTarget.x === newX && this.enPassantTarget.y === newY) {
                    const move: any = { x: newX, y: newY };
                    if (newY === promotionRow) {
                        move.promotion = true;
                    }
                    moves.push(move);
                }
            }
        }
    }

    addKnightMoves(x: number, y: number, isWhite: boolean, moves: any[]): void {
        const knightMoves = [
            { dx: -2, dy: -1 }, { dx: -2, dy: 1 },
            { dx: 2, dy: -1 },  { dx: 2, dy: 1 },
            { dx: -1, dy: -2 }, { dx: -1, dy: 2 },
            { dx: 1, dy: -2 },  { dx: 1, dy: 2 }
        ];

        for (const move of knightMoves) {
            const newX = x + move.dx;
            const newY = y + move.dy;
            if (this.canMoveTo(newX, newY, isWhite)) {
                moves.push({ x: newX, y: newY });
            }
        }
    }

    addBishopMoves(x: number, y: number, isWhite: boolean, moves: any[]): void {
        const directions = [
            { dx: -1, dy: -1 }, { dx: 1, dy: 1 },
            { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        for (const dir of directions) {
            let newX = x + dir.dx;
            let newY = y + dir.dy;
            while (this.isValidPosition(newX, newY)) {
                if (!this.isSquareOccupied(newX, newY)) {
                    moves.push({ x: newX, y: newY });
                } else {
                    if (this.canMoveTo(newX, newY, isWhite)) {
                        moves.push({ x: newX, y: newY });
                    }
                    break; // Blocked by piece
                }
                newX += dir.dx;
                newY += dir.dy;
            }
        }
    }

    addRookMoves(x: number, y: number, isWhite: boolean, moves: any[]): void {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        for (const dir of directions) {
            let newX = x + dir.dx;
            let newY = y + dir.dy;
            while (this.isValidPosition(newX, newY)) {
                if (!this.isSquareOccupied(newX, newY)) {
                    moves.push({ x: newX, y: newY });
                } else {
                    if (this.canMoveTo(newX, newY, isWhite)) {
                        moves.push({ x: newX, y: newY });
                    }
                    break; // Blocked by piece
                }
                newX += dir.dx;
                newY += dir.dy;
            }
        }
    }

    addQueenMoves(x: number, y: number, isWhite: boolean, moves: any[]): void {
        this.addBishopMoves(x, y, isWhite, moves);
        this.addRookMoves(x, y, isWhite, moves);
    }

    addKingMoves(x: number, y: number, isWhite: boolean, moves: any[], isAttackCheck: boolean = false): void {
        const directions = [
            { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
            { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
        ];

        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            if (this.canMoveTo(newX, newY, isWhite)) {
                moves.push({ x: newX, y: newY });
            }
        }

        // Castling - only check when not in attack detection context
        if (!isAttackCheck && !this.isInCheck(isWhite)) {
            this.addCastlingMoves(x, y, isWhite, moves);
        }
    }

    addCastlingMoves(x: number, y: number, isWhite: boolean, moves: any[]): void {
        const row = isWhite ? 0 : 7;
        
        if (isWhite) {
            // Kingside castling
            if (this.whiteCastleKingside && !this.isSquareOccupied(5, row) && !this.isSquareOccupied(6, row)) {
                if (!this.isSquareAttacked(5, row, isWhite) && !this.isSquareAttacked(6, row, isWhite)) {
                    moves.push({ x: 6, y: row, secondary: { fromX: 7, fromY: row, toX: 5, toY: row } });
                }
            }
            // Queenside castling
            if (this.whiteCastleQueenside && !this.isSquareOccupied(3, row) && !this.isSquareOccupied(2, row) && !this.isSquareOccupied(1, row)) {
                if (!this.isSquareAttacked(3, row, isWhite) && !this.isSquareAttacked(2, row, isWhite)) {
                    moves.push({ x: 2, y: row, secondary: { fromX: 0, fromY: row, toX: 3, toY: row } });
                }
            }
        } else {
            // Kingside castling
            if (this.blackCastleKingside && !this.isSquareOccupied(5, row) && !this.isSquareOccupied(6, row)) {
                if (!this.isSquareAttacked(5, row, isWhite) && !this.isSquareAttacked(6, row, isWhite)) {
                    moves.push({ x: 6, y: row, secondary: { fromX: 7, fromY: row, toX: 5, toY: row } });
                }
            }
            // Queenside castling
            if (this.blackCastleQueenside && !this.isSquareOccupied(3, row) && !this.isSquareOccupied(2, row) && !this.isSquareOccupied(1, row)) {
                if (!this.isSquareAttacked(3, row, isWhite) && !this.isSquareAttacked(2, row, isWhite)) {
                    moves.push({ x: 2, y: row, secondary: { fromX: 0, fromY: row, toX: 3, toY: row } });
                }
            }
        }
    }

    isSquareAttacked(x: number, y: number, isWhite: boolean): boolean {
        const opponentPieces = isWhite 
            ? [7, 8, 9, 10, 11, 12] 
            : [1, 2, 3, 4, 5, 6];

        for (let oy = 0; oy < 8; oy++) {
            for (let ox = 0; ox < 8; ox++) {
                const piece = this.getPieceAt(ox, oy);
                if (opponentPieces.includes(piece)) {
                    if (this.pieceAttacksSquare(ox, oy, x, y)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isMoveValid(fromX: number, fromY: number, toX: number, toY: number, secondary: any): boolean {
        // Make the move temporarily
        const piece = this.getPieceAt(fromX, fromY);
        const capturedPiece = this.getPieceAt(toX, toY);
        const secondaryPiece = secondary ? this.getPieceAt(secondary.fromX, secondary.fromY) : undefined;

        this.board[this.getBoardIndex(fromX, fromY)] = Chess.PIECES.EMPTY;
        this.board[this.getBoardIndex(toX, toY)] = piece;
        
        if (secondary) {
            this.board[this.getBoardIndex(secondary.fromX, secondary.fromY)] = Chess.PIECES.EMPTY;
            this.board[this.getBoardIndex(secondary.toX, secondary.toY)] = secondaryPiece!;
        }

        // Check if king is in check
        const isWhite = this.isWhite(piece);
        const kingInCheck = this.isInCheck(isWhite);

        // Restore the board
        this.board[this.getBoardIndex(fromX, fromY)] = piece;
        this.board[this.getBoardIndex(toX, toY)] = capturedPiece;
        
        if (secondary) {
            this.board[this.getBoardIndex(secondary.fromX, secondary.fromY)] = secondaryPiece!;
            this.board[this.getBoardIndex(secondary.toX, secondary.toY)] = Chess.PIECES.EMPTY;
        }

        return !kingInCheck;
    }

    getAvailableMoves(x: number, y: number): Array<{
        x: number; 
        y: number; 
        secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined;
        promotion?: boolean;
    }> {
        const piece = this.getPieceAt(x, y);
        if (piece === Chess.PIECES.EMPTY) {
            return [];
        }
        return this.getPieceMoves(x, y, piece, false);
    }

    // Move a piece from (fromX, fromY) to (toX, toY), with optional secondary move and promotion piece
    movePiece(fromX: number, fromY: number, toX: number, toY: number, secondary?: {fromX: number, fromY: number, toX: number, toY: number}, promotionPiece?: number) {
        const piece = this.board[fromX + fromY * 8];
        const capturedPiece = this.board[toX + toY * 8];
        
        if (piece !== undefined) {
            this.board[fromX + fromY * 8] = Chess.PIECES.EMPTY;
            
            // Handle pawn promotion
            if ((piece === Chess.PIECES.WHITE_PAWN && toY === 7) || (piece === Chess.PIECES.BLACK_PAWN && toY === 0)) {
                // Default to queen if no promotion piece specified
                const promotedPiece = promotionPiece || (piece === Chess.PIECES.WHITE_PAWN ? Chess.PIECES.WHITE_QUEEN : Chess.PIECES.BLACK_QUEEN);
                this.board[toX + toY * 8] = promotedPiece;
            } else {
                this.board[toX + toY * 8] = piece;
            }
        }
        
        // Handle secondary move if present (e.g., rook move during castling)
        if (secondary) {
            const secondaryPiece = this.board[secondary.fromX + secondary.fromY * 8];
            if (secondaryPiece !== undefined) {
                this.board[secondary.fromX + secondary.fromY * 8] = Chess.PIECES.EMPTY;
                this.board[secondary.toX + secondary.toY * 8] = secondaryPiece;
            }
        }

        // Update castling rights
        if (piece === Chess.PIECES.WHITE_KING) {
            this.whiteCastleKingside = false;
            this.whiteCastleQueenside = false;
            this.whiteKingPosition = { x: toX, y: toY };
        } else if (piece === Chess.PIECES.BLACK_KING) {
            this.blackCastleKingside = false;
            this.blackCastleQueenside = false;
            this.blackKingPosition = { x: toX, y: toY };
        } else if (piece === Chess.PIECES.WHITE_ROOK) {
            if (fromX === 0 && fromY === 0) {
                this.whiteCastleQueenside = false;
            } else if (fromX === 7 && fromY === 0) {
                this.whiteCastleKingside = false;
            }
        } else if (piece === Chess.PIECES.BLACK_ROOK) {
            if (fromX === 0 && fromY === 7) {
                this.blackCastleQueenside = false;
            } else if (fromX === 7 && fromY === 7) {
                this.blackCastleKingside = false;
            }
        }

        // Handle en passant capture
        if (piece === Chess.PIECES.WHITE_PAWN || piece === Chess.PIECES.BLACK_PAWN) {
            if (this.enPassantTarget && toX === this.enPassantTarget.x && toY === this.enPassantTarget.y) {
                const capturedPawnY = piece === Chess.PIECES.WHITE_PAWN ? toY - 1 : toY + 1;
                this.board[toX + capturedPawnY * 8] = Chess.PIECES.EMPTY;
            }
            // Set en passant target
            if (Math.abs(toY - fromY) === 2) {
                this.enPassantTarget = { x: fromX, y: (fromY + toY) / 2 };
            } else {
                this.enPassantTarget = null;
            }
        } else {
            this.enPassantTarget = null;
        }

        // Update half-move clock and full move number
        if (piece && (piece === Chess.PIECES.WHITE_PAWN || piece === Chess.PIECES.BLACK_PAWN || capturedPiece !== Chess.PIECES.EMPTY)) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        if (piece && this.isWhite(piece)) {
            this.fullMoveNumber++;
        }
        this.whiteTurn = !this.whiteTurn;
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

        // Reset additional properties
        this.whiteKingPosition = { x: 4, y: 0 };
        this.blackKingPosition = { x: 4, y: 7 };
        this.whiteCastleKingside = true;
        this.whiteCastleQueenside = true;
        this.blackCastleKingside = true;
        this.blackCastleQueenside = true;
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }
}