import P5 from "p5";
import { ColorUtil } from "../utils/color";
import type { GameState } from "../state/gameState";

export function drawTurnIndicator(p5: P5, colorUtil: ColorUtil, state: GameState): void {
    if (state.isSpinning) return;
    const turnText = state.chess.getWhiteTurn() ? "White's Turn" : "Black's Turn";

    p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
    p5.rect(0, 0, p5.width, 100);

    p5.textSize(50);
    p5.textStyle(p5.BOLD);
    p5.textFont("Courier");
    p5.fill(colorUtil.hexToRGBColor("#000000"));
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(turnText, p5.width / 2, 50);
}

export function drawGameStatus(p5: P5, colorUtil: ColorUtil, state: GameState): void {
    if (state.isSpinning) return;
    const chess = state.chess;

    let statusText = "";
    let textColor  = colorUtil.hexToRGBColor("#000000");

    if (chess.isCheckmate()) {
        statusText = chess.getWhiteTurn() ? "Black wins by checkmate!" : "White wins by checkmate!";
        textColor  = colorUtil.hexToRGBColor("#ff0000");
    } else if (chess.isStalemate()) {
        statusText = "Stalemate!";
        textColor  = colorUtil.hexToRGBColor("#ff8800");
    } else if (chess.isDraw()) {
        statusText = "Draw!";
        textColor  = colorUtil.hexToRGBColor("#ff8800");
    } else if (chess.isInCheck(chess.getWhiteTurn())) {
        statusText = "Check!";
        textColor  = colorUtil.hexToRGBColor("#ff0000");
    }

    if (!statusText) return;

    p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
    p5.rect(0, 0, p5.width, 100);

    p5.textSize(50);
    p5.textStyle(p5.BOLD);
    p5.textFont("Courier");
    p5.fill(textColor);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.text(statusText, p5.width / 2, 50);
}

export function drawCapturedPieces(
    p5: P5,
    colorUtil: ColorUtil,
    state: GameState,
    xOffset: number,
    yOffset: number,
    squareSize: number
): void {
    if (state.isSpinning) return;
    const chess = state.chess;

    // White captured pieces — below the board
    p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
    p5.rect(xOffset, yOffset + 8 * squareSize, 8 * squareSize, squareSize * 0.8);

    let wx = xOffset + squareSize * 0.5;
    for (const piece of chess.getCapturedWhitePieces()) {
        const img = state.pieceToImageMap.get(chess.getPieceName(piece));
        if (img) {
            p5.image(img, wx, yOffset + 8 * squareSize + squareSize * 0.1, squareSize * 0.6, squareSize * 0.6);
            wx += squareSize * 0.7;
        }
    }

    // Black captured pieces — above the board
    p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
    p5.rect(xOffset, yOffset - squareSize * 0.8, 8 * squareSize, squareSize * 0.8);

    let bx = xOffset + squareSize * 0.5;
    for (const piece of chess.getCapturedBlackPieces()) {
        const img = state.pieceToImageMap.get(chess.getPieceName(piece));
        if (img) {
            p5.image(img, bx, yOffset - squareSize * 0.7, squareSize * 0.6, squareSize * 0.6);
            bx += squareSize * 0.7;
        }
    }
}
