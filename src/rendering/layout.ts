import type p5 from "p5";

export interface BoardLayout {
    SQUARE_SIZE: number;
    totalWidth: number;
    xOffset: number;
    yOffset: number;
}

export function getBoardLayout(p5: p5): BoardLayout {
    const SQUARE_UNIT = 8;
    const SQUARE_SIZE = Math.min(
        (p5.windowWidth) / SQUARE_UNIT,
        (p5.windowHeight - 400) / SQUARE_UNIT
    );
    const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
    const xOffset = (p5.windowWidth  - totalWidth) / 2;
    const yOffset = (p5.windowHeight - totalWidth) / 2;
    return { SQUARE_SIZE, totalWidth, xOffset, yOffset };
}
