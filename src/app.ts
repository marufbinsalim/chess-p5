import P5 from "p5";
import "p5/lib/addons/p5.dom";
import "p5/lib/addons/p5.sound";


// ─── Asset imports ────────────────────────────────────────────────────────────
import wP from "../assets/wP.svg";
import bP from "../assets/bP.svg";
import wK from "../assets/wK.svg";
import bK from "../assets/bK.svg";
import wB from "../assets/wB.svg";
import bB from "../assets/bB.svg";
import wR from "../assets/wR.svg";
import bR from "../assets/bR.svg";
import wQ from "../assets/wQ.svg";
import bQ from "../assets/bQ.svg";
import wN from "../assets/wN.svg";
import bN from "../assets/bN.svg";
import moveSoundFile    from "../assets/move.mp3";
import captureSoundFile from "../assets/capture.mp3";

import { Chess } from "./chess/Chess";
import { ColorUtil } from "./utils/color";
import type { GameState } from "./state/gameState";
import { handleMouseClick } from "./input/mouse";
import { startSpinAnimation, updateSpinAnimation } from "./rendering/orientation";
import { getBoardLayout } from "./rendering/layout";
import { drawBoard } from "./rendering/board";
import { drawPromotionUI } from "./rendering/promotion";
import { drawAnimatedPieces } from "./rendering/animation";
import { drawCapturedPieces, drawGameStatus, drawTurnIndicator } from "./rendering/hud";

// ─── Sketch ───────────────────────────────────────────────────────────────────

const sketch = (p5: P5) => {
    let canvas: P5.Renderer;
    const colorUtil = new ColorUtil(p5);

    // Lazy-initialised after preload
    const state = {
        chess: new Chess(),
        pieceToImageMap: new Map<string, P5.Image>(),
        selectedPiece: null,
        availableMoves: [],
        animatedPieces: [],
        pendingPromotion: null,
        spinAnimationProgress: 0,
        isSpinning: false,
        targetOrientation: false,
    } as unknown as GameState;

    // ── Canvas setup ──────────────────────────────────────────────────────────

    function setupCanvas(): void {
        if (!canvas) canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
        canvas.parent("app");
        p5.resizeCanvas(window.innerWidth, window.innerHeight);
        p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
        p5.noStroke();
    }

    // ── p5 lifecycle ──────────────────────────────────────────────────────────

    p5.preload = () => {
        const load = (key: string, src: string) => state.pieceToImageMap.set(key, p5.loadImage(src));
        load("wP", wP); load("bP", bP);
        load("wK", wK); load("bK", bK);
        load("wB", wB); load("bB", bB);
        load("wR", wR); load("bR", bR);
        load("wQ", wQ); load("bQ", bQ);
        load("wN", wN); load("bN", bN);

        state.moveSound    = p5.loadSound(moveSoundFile);
        state.captureSound = p5.loadSound(captureSoundFile);
    };

    p5.setup = () => {
        setupCanvas();
        p5.mousePressed = () => handleMouseClick(p5, state);
    };

    p5.windowResized = () => {
        setupCanvas();
    };

    p5.draw = () => {
        p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
        p5.noStroke();

        updateSpinAnimation(state);

        const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout();

        // Apply board spin transform
        if (state.isSpinning) {
            p5.push();
            const { totalWidth } = getBoardLayout();
            const centerX = xOffset + totalWidth / 2;
            const centerY = yOffset + totalWidth / 2;
            p5.translate(centerX, centerY);
            const easeProgress = 1 - Math.pow(1 - state.spinAnimationProgress, 3);
            p5.rotate(easeProgress * Math.PI);
            p5.translate(-centerX, -centerY);
        }

        drawBoard(p5, colorUtil, state);

        if (state.pendingPromotion) {
            drawPromotionUI(p5, colorUtil, state, state.pendingPromotion);
        }

        drawAnimatedPieces(p5, state);

        if (state.isSpinning) {
            p5.pop();
        }

        drawTurnIndicator(p5, colorUtil, state);
        drawCapturedPieces(p5, colorUtil, state, xOffset, yOffset, SQUARE_SIZE);
        drawGameStatus(p5, colorUtil, state);

        tickAnimations(state);
    };
};

// ─── Animation tick (extracted to keep draw() concise) ───────────────────────

function tickAnimations(state: GameState): void {
    if (state.animatedPieces.length === 0) return;

    let allComplete = true;
    for (const anim of state.animatedPieces) {
        anim.progress += 0.05;
        if (anim.progress < 1) allComplete = false;
    }

    if (!allComplete) return;

    // Find if any animated piece has a secondary (castling) move
    let handledSecondary = false;
    for (const anim of state.animatedPieces) {
        const matchingMove = state.availableMoves.find((m) => m.x === anim.toX && m.y === anim.toY);
        if (matchingMove?.secondary) {
            state.chess.movePiece(anim.fromX, anim.fromY, anim.toX, anim.toY, matchingMove.secondary);
            handledSecondary = true;
            break;
        }
    }

    if (!handledSecondary) {
        for (const anim of state.animatedPieces) {
            state.chess.movePiece(anim.fromX, anim.fromY, anim.toX, anim.toY);
        }
    }

    state.animatedPieces = [];
    state.selectedPiece  = null;
    state.availableMoves = [];

    startSpinAnimation(state);
}

new P5(sketch);
