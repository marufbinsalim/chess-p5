import P5 from "p5";
import { Chess } from "../chess/Chess";
import type { Move } from "../chess/moveTypes";
import type { MultiplayerManager } from "../database/multiplayer";

/** All mutable UI/game state shared across modules. */
export interface GameState {
    chess: Chess;
    pieceToImageMap: Map<string, P5.Image>;

    selectedPiece: { x: number; y: number } | null;
    availableMoves: Move[];

    animatedPieces: Array<{
        fromX: number; fromY: number;
        toX: number;   toY: number;
        progress: number;
        piece: string;
    }>;

    pendingPromotion: { fromX: number; fromY: number; toX: number; toY: number } | null;

    moveSound: P5.SoundFile;
    captureSound: P5.SoundFile;

    // Multiplayer state
    multiplayer: MultiplayerManager | null;
}

export function createInitialState(chess: Chess): Omit<GameState, "pieceToImageMap" | "moveSound" | "captureSound"> {
    return {
        chess,
        selectedPiece: null,
        availableMoves: [],
        animatedPieces: [],
        pendingPromotion: null,
        multiplayer: null,
    };
}
