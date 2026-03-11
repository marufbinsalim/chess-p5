import { PIECES, getPieceName, isWhitePiece, isBlackPiece } from "./pieces";
import { getBoardIndex, getPieceAt, isSquareOccupied, canMoveTo } from "./boardUtils";
import type { Move, SecondaryMove } from "./moveTypes";
import { addPawnMoves } from "./moves/pawn";
import { addKnightMoves } from "./moves/knight";
import { addBishopMoves, addRookMoves, addQueenMoves } from "./moves/sliding";
import { addKingMoves, type CastlingRights } from "./moves/king";
import {
    isInCheck as checkIsInCheck,
    isSquareAttacked as checkIsSquareAttacked,
    isCheckmate as checkIsCheckmate,
    isStalemate as checkIsStalemate,
    isDraw as checkIsDraw,
} from "./gameStatus";

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

    private _capturedWhitePieces: number[] = [];
    private _capturedBlackPieces: number[] = [];

    whiteTurn = true;

    // Re-export piece constants for consumers
    static PIECES = PIECES;

    constructor() {
        this.resetBoard();
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    getWhiteTurn(): boolean {
        return this.whiteTurn;
    }

    getCapturedWhitePieces(): number[] {
        return [...this._capturedWhitePieces];
    }

    getCapturedBlackPieces(): number[] {
        return [...this._capturedBlackPieces];
    }

    getPieceName(piece: number): string {
        return getPieceName(piece);
    }

    getPiece(x: number, y: number): string {
        return getPieceName(this.board[x + y * 8] || 0);
    }

    getPieceAt(x: number, y: number): number {
        return getPieceAt(this.board, x, y);
    }

    isWhite(piece: number): boolean {
        return isWhitePiece(piece);
    }

    isBlack(piece: number): boolean {
        return isBlackPiece(piece);
    }

    // ─── Move generation ─────────────────────────────────────────────────────

    getAvailableMoves(x: number, y: number): Move[] {
        const piece = this.getPieceAt(x, y);
        if (piece === PIECES.EMPTY) return [];
        return this._getPieceMoves(x, y, piece, /* includeInvalid */ false);
    }

    private _getPieceMoves(
        x: number,
        y: number,
        piece: number,
        includeInvalid: boolean,
        isAttackCheck = false
    ): Move[] {
        const white = isWhitePiece(piece);
        // When checking attacks we must bypass the turn guard — the attacker
        // may not be the side whose turn it currently is.
        if (!isAttackCheck && this.whiteTurn !== white) return [];

        const moves: Move[] = [];

        switch (piece) {
            case PIECES.WHITE_PAWN:
            case PIECES.BLACK_PAWN:
                addPawnMoves(this.board, x, y, white, this.enPassantTarget, moves);
                break;
            case PIECES.WHITE_KNIGHT:
            case PIECES.BLACK_KNIGHT:
                addKnightMoves(this.board, x, y, white, moves);
                break;
            case PIECES.WHITE_BISHOP:
            case PIECES.BLACK_BISHOP:
                addBishopMoves(this.board, x, y, white, moves);
                break;
            case PIECES.WHITE_ROOK:
            case PIECES.BLACK_ROOK:
                addRookMoves(this.board, x, y, white, moves);
                break;
            case PIECES.WHITE_QUEEN:
            case PIECES.BLACK_QUEEN:
                addQueenMoves(this.board, x, y, white, moves);
                break;
            case PIECES.WHITE_KING:
            case PIECES.BLACK_KING:
                addKingMoves(
                    this.board, x, y, white,
                    this._castlingRights(),
                    (w) => this.isInCheck(w),
                    (sx, sy, sw) => this.isSquareAttacked(sx, sy, sw),
                    moves,
                    isAttackCheck
                );
                break;
        }

        if (includeInvalid) return moves;
        return moves.filter((m) => this._isMoveValid(x, y, m.x, m.y, m.secondary));
    }

    /** Used by attack-detection logic (bypasses turn & validity filters). */
    pieceAttacksSquare(fromX: number, fromY: number, toX: number, toY: number): boolean {
        const piece = this.getPieceAt(fromX, fromY);
        // Pass isAttackCheck=true so the turn guard is bypassed — no state mutation needed.
        const moves = this._getPieceMoves(fromX, fromY, piece, true, true);
        return moves.some((m) => m.x === toX && m.y === toY);
    }

    private _castlingRights(): CastlingRights {
        return {
            whiteCastleKingside:  this.whiteCastleKingside,
            whiteCastleQueenside: this.whiteCastleQueenside,
            blackCastleKingside:  this.blackCastleKingside,
            blackCastleQueenside: this.blackCastleQueenside,
        };
    }

    private _isMoveValid(
        fromX: number, fromY: number,
        toX: number, toY: number,
        secondary?: SecondaryMove
    ): boolean {
        const piece         = this.getPieceAt(fromX, fromY);
        const capturedPiece = this.getPieceAt(toX, toY);
        const secondaryPiece = secondary ? this.getPieceAt(secondary.fromX, secondary.fromY) : undefined;
        const white = isWhitePiece(piece);

        // If the king is moving, temporarily update its tracked position so
        // isInCheck looks at the right square.
        const savedWhiteKing = this.whiteKingPosition;
        const savedBlackKing = this.blackKingPosition;
        if (piece === PIECES.WHITE_KING) this.whiteKingPosition = { x: toX, y: toY };
        if (piece === PIECES.BLACK_KING) this.blackKingPosition = { x: toX, y: toY };

        // Apply move temporarily
        this.board[getBoardIndex(fromX, fromY)] = PIECES.EMPTY;
        this.board[getBoardIndex(toX, toY)]     = piece;
        if (secondary) {
            this.board[getBoardIndex(secondary.fromX, secondary.fromY)] = PIECES.EMPTY;
            this.board[getBoardIndex(secondary.toX,   secondary.toY)]   = secondaryPiece!;
        }

        const kingInCheck = this.isInCheck(white);

        // Restore board
        this.board[getBoardIndex(fromX, fromY)] = piece;
        this.board[getBoardIndex(toX, toY)]     = capturedPiece;
        if (secondary) {
            this.board[getBoardIndex(secondary.fromX, secondary.fromY)] = secondaryPiece!;
            this.board[getBoardIndex(secondary.toX,   secondary.toY)]   = PIECES.EMPTY;
        }

        // Restore king positions
        this.whiteKingPosition = savedWhiteKing;
        this.blackKingPosition = savedBlackKing;

        return !kingInCheck;
    }

    // ─── Game status ─────────────────────────────────────────────────────────

    isInCheck(isWhite: boolean): boolean {
        const kingPos = isWhite ? this.whiteKingPosition : this.blackKingPosition;
        return checkIsInCheck(
            this.board, isWhite, kingPos,
            (fx, fy, tx, ty) => this.pieceAttacksSquare(fx, fy, tx, ty)
        );
    }

    isSquareAttacked(x: number, y: number, isWhite: boolean): boolean {
        return checkIsSquareAttacked(
            this.board, x, y, isWhite,
            (fx, fy, tx, ty) => this.pieceAttacksSquare(fx, fy, tx, ty)
        );
    }

    isCheckmate(): boolean {
        return checkIsCheckmate(
            this.board, this.whiteTurn,
            (w) => this.isInCheck(w),
            (x, y) => this.getAvailableMoves(x, y)
        );
    }

    isStalemate(): boolean {
        return checkIsStalemate(
            this.board, this.whiteTurn,
            (w) => this.isInCheck(w),
            (x, y) => this.getAvailableMoves(x, y)
        );
    }

    isDraw(): boolean {
        return checkIsDraw(this.board, this.halfMoveClock);
    }

    // ─── Mutation ────────────────────────────────────────────────────────────

    movePiece(
        fromX: number, fromY: number,
        toX: number,   toY: number,
        secondary?: SecondaryMove,
        promotionPiece?: number
    ): void {
        const piece         = this.board[fromX + fromY * 8];
        const capturedPiece = this.board[toX   + toY   * 8];

        // Track captures
        if (capturedPiece !== undefined && capturedPiece !== PIECES.EMPTY) {
            if (isWhitePiece(capturedPiece)) this._capturedWhitePieces.push(capturedPiece);
            else                             this._capturedBlackPieces.push(capturedPiece);
        }

        if (piece !== undefined) {
            this.board[fromX + fromY * 8] = PIECES.EMPTY;

            const isPromotion =
                (piece === PIECES.WHITE_PAWN && toY === 7) ||
                (piece === PIECES.BLACK_PAWN && toY === 0);

            if (isPromotion) {
                const promoted = promotionPiece ??
                    (piece === PIECES.WHITE_PAWN ? PIECES.WHITE_QUEEN : PIECES.BLACK_QUEEN);
                this.board[toX + toY * 8] = promoted;
            } else {
                this.board[toX + toY * 8] = piece;
            }
        }

        // Handle secondary move (castling rook)
        if (secondary) {
            const rookPiece = this.board[secondary.fromX + secondary.fromY * 8];
            if (rookPiece !== undefined) {
                this.board[secondary.fromX + secondary.fromY * 8] = PIECES.EMPTY;
                this.board[secondary.toX   + secondary.toY   * 8] = rookPiece;
            }
        }

        piece && this._updateCastlingRights(piece, fromX, fromY, toX, toY);
        piece && this._updateEnPassant(piece, fromX, fromY, toX, toY);
        piece && capturedPiece && this._updateClocks(piece, capturedPiece);

        this.whiteTurn = !this.whiteTurn;
    }

    private _updateCastlingRights(piece: number, fromX: number, fromY: number, toX: number, toY: number): void {
        if (piece === PIECES.WHITE_KING) {
            this.whiteCastleKingside = false;
            this.whiteCastleQueenside = false;
            this.whiteKingPosition = { x: toX, y: toY };
        } else if (piece === PIECES.BLACK_KING) {
            this.blackCastleKingside = false;
            this.blackCastleQueenside = false;
            this.blackKingPosition = { x: toX, y: toY };
        } else if (piece === PIECES.WHITE_ROOK) {
            if (fromX === 0 && fromY === 0) this.whiteCastleQueenside = false;
            if (fromX === 7 && fromY === 0) this.whiteCastleKingside  = false;
        } else if (piece === PIECES.BLACK_ROOK) {
            if (fromX === 0 && fromY === 7) this.blackCastleQueenside = false;
            if (fromX === 7 && fromY === 7) this.blackCastleKingside  = false;
        }
    }

    private _updateEnPassant(piece: number, fromX: number, fromY: number, toX: number, toY: number): void {
        const isPawn = piece === PIECES.WHITE_PAWN || piece === PIECES.BLACK_PAWN;
        if (!isPawn) {
            this.enPassantTarget = null;
            return;
        }

        // Capture en passant
        if (this.enPassantTarget && toX === this.enPassantTarget.x && toY === this.enPassantTarget.y) {
            const capturedPawnY = piece === PIECES.WHITE_PAWN ? toY - 1 : toY + 1;
            this.board[toX + capturedPawnY * 8] = PIECES.EMPTY;
        }

        // Set new en passant target on double push
        if (Math.abs(toY - fromY) === 2) {
            this.enPassantTarget = { x: fromX, y: (fromY + toY) / 2 };
        } else {
            this.enPassantTarget = null;
        }
    }

    private _updateClocks(piece: number, capturedPiece: number): void {
        const isPawn = piece === PIECES.WHITE_PAWN || piece === PIECES.BLACK_PAWN;
        const isCapture = capturedPiece !== PIECES.EMPTY;

        if (isPawn || isCapture) this.halfMoveClock = 0;
        else                     this.halfMoveClock++;

        if (piece && isWhitePiece(piece)) this.fullMoveNumber++;
    }

    // ─── Board setup ─────────────────────────────────────────────────────────

    resetBoard(): void {
        this.board = new Array(64).fill(PIECES.EMPTY);
        this._capturedWhitePieces = [];
        this._capturedBlackPieces = [];

        // White back rank
        this.board[0] = PIECES.WHITE_ROOK;
        this.board[1] = PIECES.WHITE_KNIGHT;
        this.board[2] = PIECES.WHITE_BISHOP;
        this.board[3] = PIECES.WHITE_QUEEN;
        this.board[4] = PIECES.WHITE_KING;
        this.board[5] = PIECES.WHITE_BISHOP;
        this.board[6] = PIECES.WHITE_KNIGHT;
        this.board[7] = PIECES.WHITE_ROOK;
        for (let i = 8; i < 16; i++) this.board[i] = PIECES.WHITE_PAWN;

        // Black back rank
        for (let i = 48; i < 56; i++) this.board[i] = PIECES.BLACK_PAWN;
        this.board[56] = PIECES.BLACK_ROOK;
        this.board[57] = PIECES.BLACK_KNIGHT;
        this.board[58] = PIECES.BLACK_BISHOP;
        this.board[59] = PIECES.BLACK_QUEEN;
        this.board[60] = PIECES.BLACK_KING;
        this.board[61] = PIECES.BLACK_BISHOP;
        this.board[62] = PIECES.BLACK_KNIGHT;
        this.board[63] = PIECES.BLACK_ROOK;

        this.whiteKingPosition  = { x: 4, y: 0 };
        this.blackKingPosition  = { x: 4, y: 7 };
        this.whiteCastleKingside  = true;
        this.whiteCastleQueenside = true;
        this.blackCastleKingside  = true;
        this.blackCastleQueenside = true;
        this.enPassantTarget    = null;
        this.halfMoveClock      = 0;
        this.fullMoveNumber     = 1;
        this.whiteTurn          = true;
    }
}