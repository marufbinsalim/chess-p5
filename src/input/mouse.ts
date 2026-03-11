import P5 from "p5";
import { getBoardLayout } from "../rendering/layout";
import { screenToBoardCoords } from "../rendering/orientation";
import { handlePromotionClick } from "../rendering/promotion";
import type { GameState } from "../state/gameState";

export function handleMouseClick(p5: P5, state: GameState): void {
    // Handle pending promotion first
    if (state.pendingPromotion) {
        const selectedPiece = handlePromotionClick(p5, state, state.pendingPromotion);
        if (selectedPiece !== null) {
            const idx = state.pendingPromotion.toX + state.pendingPromotion.toY * 8;
            state.chess.board[idx] = selectedPiece;
            state.pendingPromotion = null;
        }
        return;
    }

    const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout();
    const { x: boardX, y: boardY } = screenToBoardCoords(state, p5.mouseX, p5.mouseY, xOffset, yOffset, SQUARE_SIZE);

    if (boardX < 0 || boardX >= 8 || boardY < 0 || boardY >= 8) return;

    if (!state.selectedPiece) {
        trySelectPiece(state, boardX, boardY);
    } else {
        const selectedMove = state.availableMoves.find((m) => m.x === boardX && m.y === boardY);
        if (selectedMove) {
            executeMoveOrPromotion(state, selectedMove, boardX, boardY);
        } else {
            // Re-select or deselect
            trySelectPiece(state, boardX, boardY);
            if (state.chess.getPiece(boardX, boardY) === "EMPTY") {
                state.selectedPiece = null;
                state.availableMoves = [];
            }
        }
    }
}

function trySelectPiece(state: GameState, x: number, y: number): void {
    if (state.chess.getPiece(x, y) !== "EMPTY") {
        state.selectedPiece = { x, y };
        state.availableMoves = state.chess.getAvailableMoves(x, y);
    }
}

function executeMoveOrPromotion(
    state: GameState,
    selectedMove: GameState["availableMoves"][number],
    boardX: number,
    boardY: number
): void {
    const isCapture  = state.chess.getPiece(selectedMove.x, selectedMove.y) !== "EMPTY";
    const isEnPassant =
        state.chess.enPassantTarget?.x === selectedMove.x &&
        state.chess.enPassantTarget?.y === selectedMove.y;

    if (isCapture || isEnPassant) {
        state.captureSound.play();
    } else {
        state.moveSound.play();
    }

    if (selectedMove.promotion) {
        state.chess.movePiece(
            state.selectedPiece!.x,
            state.selectedPiece!.y,
            selectedMove.x,
            selectedMove.y
        );
        state.pendingPromotion = {
            fromX: state.selectedPiece!.x,
            fromY: state.selectedPiece!.y,
            toX: selectedMove.x,
            toY: selectedMove.y,
        };
        state.selectedPiece  = null;
        state.availableMoves = [];
    } else {
        startPieceAnimation(state, selectedMove);
    }
}

function startPieceAnimation(
    state: GameState,
    selectedMove: GameState["availableMoves"][number]
): void {
    state.animatedPieces = [];

    state.animatedPieces.push({
        fromX: state.selectedPiece!.x,
        fromY: state.selectedPiece!.y,
        toX:   selectedMove.x,
        toY:   selectedMove.y,
        progress: 0,
        piece: state.chess.getPiece(state.selectedPiece!.x, state.selectedPiece!.y),
    });

    if (selectedMove.secondary) {
        const { fromX, fromY, toX, toY } = selectedMove.secondary;
        state.animatedPieces.push({
            fromX, fromY, toX, toY,
            progress: 0,
            piece: state.chess.getPiece(fromX, fromY),
        });
    }
}
