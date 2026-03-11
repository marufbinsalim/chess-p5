import P5 from "p5";
import { getBoardLayout } from "./layout";
import { translateBoardCoords } from "./orientation";
import type { GameState } from "../state/gameState";

export function drawAnimatedPieces(p5: P5, state: GameState): void {
    const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout();

    for (const anim of state.animatedPieces) {
        const pieceImage = state.pieceToImageMap.get(anim.piece);
        if (!pieceImage) continue;

        const { x: fromDisplayX, y: fromDisplayY } = translateBoardCoords(state, anim.fromX, anim.fromY);
        const { x: toDisplayX,   y: toDisplayY   } = translateBoardCoords(state, anim.toX,   anim.toY);

        const currentX = xOffset + (fromDisplayX + (toDisplayX - fromDisplayX) * anim.progress) * SQUARE_SIZE;
        const currentY = yOffset + (fromDisplayY + (toDisplayY - fromDisplayY) * anim.progress) * SQUARE_SIZE;

        p5.image(pieceImage, currentX, currentY, SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9);
    }
}
