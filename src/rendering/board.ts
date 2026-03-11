import P5 from "p5";

import { getBoardLayout } from "./layout";
import { translateBoardCoords } from "./orientation";
import type { ColorUtil } from "../utils/color";
import type { GameState } from "../state/gameState";

const LIGHT_SQUARE = "#ffffff";
const DARK_SQUARE  = "#b17b58";

export function drawBoard(p5: P5, colorUtil: ColorUtil
    , state: GameState): void {
    const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout();

    let isDarkSquare = false;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const { x: boardX, y: boardY } = translateBoardCoords(state, i, j);

            p5.fill(isDarkSquare
                ? colorUtil.hexToRGBColor(DARK_SQUARE)
                : colorUtil.hexToRGBColor(LIGHT_SQUARE)
            );
            p5.rect(xOffset + i * SQUARE_SIZE, yOffset + j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

            // Draw static (non-animating) piece
            const pieceImage = state.pieceToImageMap.get(state.chess.getPiece(boardX, boardY));
            const isAnimating = state.animatedPieces.some(
                (a) => a.fromX === boardX && a.fromY === boardY
            );
            if (pieceImage && !isAnimating) {
                p5.image(
                    pieceImage,
                    xOffset + i * SQUARE_SIZE,
                    yOffset + j * SQUARE_SIZE,
                    SQUARE_SIZE * 0.9,
                    SQUARE_SIZE * 0.9
                );
            }

            isDarkSquare = !isDarkSquare;
        }
        isDarkSquare = !isDarkSquare;
    }

    drawAvailableMoves(p5, state, xOffset, yOffset, SQUARE_SIZE);
}

function drawAvailableMoves(
    p5: P5,
    state: GameState,
    xOffset: number,
    yOffset: number,
    squareSize: number
): void {
    if (!state.selectedPiece) return;
    p5.fill(0, 100, 0, 100);
    for (const move of state.availableMoves) {
        const { x: displayX, y: displayY } = translateBoardCoords(state, move.x, move.y);
        p5.ellipse(
            xOffset + displayX * squareSize + squareSize / 2,
            yOffset + displayY * squareSize + squareSize / 2,
            squareSize * 0.4
        );
    }
}
