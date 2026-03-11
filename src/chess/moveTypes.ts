export interface SecondaryMove {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export interface Move {
    x: number;
    y: number;
    secondary?: SecondaryMove;
    promotion?: boolean;
}
