import React, { useEffect, useRef } from 'react';
import P5 from 'p5';
import 'p5/lib/addons/p5.dom';
import 'p5/lib/addons/p5.sound';

import wP from '../../assets/wP.svg';
import bP from '../../assets/bP.svg';
import wK from '../../assets/wK.svg';
import bK from '../../assets/bK.svg';
import wB from '../../assets/wB.svg';
import bB from '../../assets/bB.svg';
import wR from '../../assets/wR.svg';
import bR from '../../assets/bR.svg';
import wQ from '../../assets/wQ.svg';
import bQ from '../../assets/bQ.svg';
import wN from '../../assets/wN.svg';
import bN from '../../assets/bN.svg';
import moveSoundFile from '../../assets/move.mp3';
import captureSoundFile from '../../assets/capture.mp3';

import { Chess } from '../chess/Chess';
import { ColorUtil } from '../utils/color';
import { handleMouseClick } from '../input/mouse';
import { drawBoard } from '../rendering/board';
import { drawPromotionUI } from '../rendering/promotion';
import { drawAnimatedPieces } from '../rendering/animation';
import { drawCapturedPieces, drawGameStatus, drawTurnIndicator } from '../rendering/hud';
import type { GameState } from '../state/gameState';
import { getBoardLayout } from '../rendering/layout';
import { MultiplayerManager } from '../database/multiplayer';

interface ChessboardProps {
  chess: Chess;
  setChess: (chess: Chess) => void;
  multiplayer: MultiplayerManager | null;
}

const Chessboard: React.FC<ChessboardProps> = ({ chess, setChess, multiplayer }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5 | null>(null);
  const stateRef = useRef<GameState>({
    chess,
    pieceToImageMap: new Map(),
    selectedPiece: null,
    availableMoves: [],
    animatedPieces: [],
    pendingPromotion: null,
    multiplayer,
    chatMessages: [],
  } as unknown as GameState);

  useEffect(() => {
    stateRef.current.chess = chess;
    stateRef.current.multiplayer = multiplayer;
  }, [chess, multiplayer]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const sketch = (p5: P5) => {
      let canvas: P5.Renderer;
      const colorUtil = new ColorUtil(p5);

      p5.preload = () => {
        const load = (key: string, src: string) =>
          stateRef.current.pieceToImageMap.set(key, p5.loadImage(src));
        load('wP', wP);
        load('bP', bP);
        load('wK', wK);
        load('bK', bK);
        load('wB', wB);
        load('bB', bB);
        load('wR', wR);
        load('bR', bR);
        load('wQ', wQ);
        load('bQ', bQ);
        load('wN', wN);
        load('bN', bN);

        stateRef.current.moveSound = p5.loadSound(moveSoundFile);
        stateRef.current.captureSound = p5.loadSound(captureSoundFile);
      };

      p5.setup = () => {
        canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
        canvas.parent(canvasRef.current!);
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        p5.background(colorUtil.hexToRGBColor('#dbdbdb'));
        p5.noStroke();
        p5.mousePressed = () => handleMouseClick(p5, stateRef.current);
      };

      p5.windowResized = () => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
      };

      p5.draw = () => {
        p5.background(colorUtil.hexToRGBColor('#dbdbdb'));
        p5.noStroke();

        const { SQUARE_SIZE, xOffset, yOffset } = getBoardLayout(p5);

        drawBoard(p5, colorUtil, stateRef.current);

        if (stateRef.current.pendingPromotion) {
          drawPromotionUI(p5, colorUtil, stateRef.current, stateRef.current.pendingPromotion);
        }

        drawAnimatedPieces(p5, stateRef.current);

        drawTurnIndicator(p5, colorUtil, stateRef.current);
        drawCapturedPieces(p5, colorUtil, stateRef.current, xOffset, yOffset, SQUARE_SIZE);
        drawGameStatus(p5, colorUtil, stateRef.current);
        tickAnimations();
      };
    };

    const p5Instance = new P5(sketch);
    p5InstanceRef.current = p5Instance;

    return () => {
      p5Instance.remove();
    };
  }, []);

  const tickAnimations = () => {
    const state = stateRef.current;
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
    state.selectedPiece = null;
    state.availableMoves = [];

    setChess(state.chess);

    // Update game state in database for multiplayer
    if (state.multiplayer) {
      state.multiplayer.updateGameState(state.chess);
    }
  };

  return <div ref={canvasRef} className="" />;
};

export default Chessboard;
