export interface BoardLayout {
    SQUARE_SIZE: number;
    totalWidth: number;
    xOffset: number;
    yOffset: number;
}

export function getBoardLayout(): BoardLayout {
    const SQUARE_UNIT = 8;
    const SQUARE_SIZE = Math.min(
        (window.innerWidth  - 200) / SQUARE_UNIT,
        (window.innerHeight - 400) / SQUARE_UNIT
    );
    const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
    const xOffset = (window.innerWidth  - totalWidth) / 2;
    const yOffset = (window.innerHeight - totalWidth) / 2;
    return { SQUARE_SIZE, totalWidth, xOffset, yOffset };
}
