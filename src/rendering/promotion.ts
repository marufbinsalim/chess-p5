import P5 from "p5";
import { ColorUtil } from "../utils/color";
import { Chess } from "../chess/Chess";
import { getBoardLayout } from "./layout";
import { translateBoardCoords } from "./orientation";
import type { GameState } from "../state/gameState";

type PromotionTarget = NonNullable<GameState["pendingPromotion"]>;

function getPromotionPieces(isWhite: boolean): number[] {
    return isWhite
        ? [Chess.PIECES.WHITE_QUEEN, Chess.PIECES.WHITE_ROOK, Chess.PIECES.WHITE_BISHOP, Chess.PIECES.WHITE_KNIGHT]
        : [Chess.PIECES.BLACK_QUEEN, Chess.PIECES.BLACK_ROOK, Chess.PIECES.BLACK_BISHOP, Chess.PIECES.BLACK_KNIGHT];
}

function getPromotionUIPosition(
    state: GameState,
    promotion: PromotionTarget,
    squareSize: number,
    xOffset: number,
    yOffset: number
): { promotionX: number; promotionY: number } {
    const isWhite = promotion.toY === 7;
    const { x: displayToX, y: displayToY } = translateBoardCoords(state, promotion.toX, promotion.toY);

    const promotionX = xOffset + displayToX * squareSize;
    let promotionY: number;

    if (isWhite) {
        promotionY = displayToY + 3 > 7
            ? yOffset + (displayToY - 3) * squareSize
            : yOffset + (displayToY + 1) * squareSize;
    } else {
        promotionY = displayToY - 3 < 0
            ? yOffset + (displayToY + 1) * squareSize
            : yOffset + (displayToY - 3) * squareSize;
    }

    return { promotionX, promotionY };
}

export function drawPromotionUI(
    p5: P5,
    colorUtil: ColorUtil,
    state: GameState,
    promotion: PromotionTarget
): void {
    const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout(p5);
    const { promotionX, promotionY } = getPromotionUIPosition(state, promotion, SQUARE_SIZE, xOffset, yOffset);
    const pieces = getPromotionPieces(promotion.toY === 7);

    p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
    p5.stroke(0);
    p5.strokeWeight(2);
    p5.rect(promotionX, promotionY, SQUARE_SIZE, SQUARE_SIZE * 4);

    for (let i = 0; i < pieces.length; i++) {

        const pieceImage =  state.pieceToImageMap.get(state.chess.getPieceName(pieces?.[i] ?? 0));
        if (pieceImage) {
            p5.image(pieceImage, promotionX, promotionY + i * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }
    }
}

/**
 * Returns the selected promotion piece value if the click hits the UI,
 * or null if the click was outside.
 */
export function handlePromotionClick(
    p5: P5,
    state: GameState,
    promotion: PromotionTarget
): number | null {
    const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout(p5);
    const { promotionX, promotionY } = getPromotionUIPosition(state, promotion, SQUARE_SIZE, xOffset, yOffset);
    const pieces = getPromotionPieces(promotion.toY === 7);

    for (let i = 0; i < pieces.length; i++) {
        const pieceY = promotionY + i * SQUARE_SIZE;
        if (
            p5.mouseX >= promotionX && p5.mouseX <= promotionX + SQUARE_SIZE &&
            p5.mouseY >= pieceY     && p5.mouseY <= pieceY     + SQUARE_SIZE
        ) {
            return pieces?.[i] ?? null;
        }
    }
    return null;
}
