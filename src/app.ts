import P5 from "p5";
import "p5/lib/addons/p5.dom";
import "p5/lib/addons/p5.sound";
import { ColorUtil } from "./utils/color";
import { Chess } from "./utils/chess";

const sketch = (p5: P5) => {
	let canvas: P5.Renderer;
	const chess = new Chess();
	let colorUtil: ColorUtil = new ColorUtil(p5);

	let pieceToImageMap = new Map<string, P5.Image>();
	let selectedPiece: {x: number, y: number} | null = null;
	let availableMoves: {x: number, y: number}[] = [];
	let animatedPiece: {
		fromX: number, fromY: number,
		toX: number, toY: number,
		progress: number,
		piece: string
	} | null = null;

	function setupCanvas() {
		if (!canvas) canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
		canvas.parent("app");
		p5.resizeCanvas(window.innerWidth, window.innerHeight);
		p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
		return canvas;
	}

	function setupChessBoard() {
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min(window.innerWidth / SQUARE_UNIT, window.innerHeight / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;
		
		let isDarkSquare = false;
		for (let i = 0; i < SQUARE_UNIT; i++) {
			for (let j = 0; j < SQUARE_UNIT; j++) {
				p5.fill(isDarkSquare ? colorUtil.hexToRGBColor("#b17b58") : colorUtil.hexToRGBColor("#ffffff"));
				p5.rect(xOffset + i * SQUARE_SIZE, yOffset + j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
				
				const pieceImage = pieceToImageMap.get(chess.getPiece(i, j));
				if (pieceImage && !(animatedPiece && animatedPiece.fromX === i && animatedPiece.fromY === j)) {
					p5.image(pieceImage, xOffset + i * SQUARE_SIZE, yOffset + j * SQUARE_SIZE);
				}
				
				isDarkSquare = !isDarkSquare;
			}
			isDarkSquare = !isDarkSquare;
		}

		// Draw available moves preview
		if (selectedPiece) {
			p5.fill(0, 100, 0, 100);
			for (const move of availableMoves) {
				p5.ellipse(
					xOffset + move.x * SQUARE_SIZE + SQUARE_SIZE / 2,
					yOffset + move.y * SQUARE_SIZE + SQUARE_SIZE / 2,
					SQUARE_SIZE * 0.4
				);
			}
		}

		// Draw animated piece
		if (animatedPiece) {
			const pieceImage = pieceToImageMap.get(animatedPiece.piece);
			if (pieceImage) {
				const currentX = xOffset + (animatedPiece.fromX + (animatedPiece.toX - animatedPiece.fromX) * animatedPiece.progress) * SQUARE_SIZE;
				const currentY = yOffset + (animatedPiece.fromY + (animatedPiece.toY - animatedPiece.fromY) * animatedPiece.progress) * SQUARE_SIZE;
				p5.image(pieceImage, currentX, currentY);
			}
		}
	}

	p5.preload = () => {
		pieceToImageMap.set("wP", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_PAWN)}.svg`));
		pieceToImageMap.set("bP", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_PAWN)}.svg`));
		pieceToImageMap.set("wK", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_KING)}.svg`));
		pieceToImageMap.set("bK", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_KING)}.svg`));
		pieceToImageMap.set("wB", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_BISHOP)}.svg`));
		pieceToImageMap.set("bB", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_BISHOP)}.svg`));
		pieceToImageMap.set("wR", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_ROOK)}.svg`));
		pieceToImageMap.set("bR", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_ROOK)}.svg`));
		pieceToImageMap.set("wQ", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_QUEEN)}.svg`));
		pieceToImageMap.set("bQ", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_QUEEN)}.svg`));
		pieceToImageMap.set("wN", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.WHITE_KNIGHT)}.svg`));
		pieceToImageMap.set("bN", p5.loadImage(`assets/${chess.getPieceName(Chess.PIECES.BLACK_KNIGHT)}.svg`));
	};

	p5.setup = () => {
		setupCanvas();
		p5.mousePressed = () => handleMouseClick();
	};

	p5.windowResized = () => {
		setupCanvas();
	};

	p5.draw = () => {
		p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
		setupChessBoard();

		// Update animation
		if (animatedPiece) {
			animatedPiece.progress += 0.05;
			if (animatedPiece.progress >= 1) {
				chess.movePiece(
					animatedPiece.fromX,
					animatedPiece.fromY,
					animatedPiece.toX,
					animatedPiece.toY
				);
				animatedPiece = null;
				selectedPiece = null;
				availableMoves = [];
			}
		}
	};

	function handleMouseClick() {
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min(window.innerWidth / SQUARE_UNIT, window.innerHeight / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;

		const boardX = Math.floor((p5.mouseX - xOffset) / SQUARE_SIZE);
		const boardY = Math.floor((p5.mouseY - yOffset) / SQUARE_SIZE);

		// Check if click is on the chess board
		if (boardX >= 0 && boardX < 8 && boardY >= 0 && boardY < 8) {
			if (!selectedPiece) {
				// Try to select a piece
				if (chess.getPiece(boardX, boardY) !== "EMPTY") {
					selectedPiece = {x: boardX, y: boardY};
					availableMoves = chess.getAvailableMoves(boardX, boardY);
				}
			} else {
				// Check if click is on an available move
				const isAvailableMove = availableMoves.some(move => move.x === boardX && move.y === boardY);
				
				if (isAvailableMove) {
					// Start animation
					animatedPiece = {
						fromX: selectedPiece.x,
						fromY: selectedPiece.y,
						toX: boardX,
						toY: boardY,
						progress: 0,
						piece: chess.getPiece(selectedPiece.x, selectedPiece.y)
					};
				} else {
					// Try to select a new piece
					if (chess.getPiece(boardX, boardY) !== "EMPTY") {
						selectedPiece = {x: boardX, y: boardY};
						availableMoves = chess.getAvailableMoves(boardX, boardY);
					} else {
						// Deselect if clicking on empty square that's not an available move
						selectedPiece = null;
						availableMoves = [];
					}
				}
			}
		}
	}
};

new P5(sketch);
