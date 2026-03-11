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



	function setupCanvas() {
		if (!canvas) canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
		canvas.parent("app");
		p5.resizeCanvas(window.innerWidth, window.innerHeight);
		p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
		return canvas;
	}


	function setupChessBoard() {
		// chess board 8 x 8
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min(window.innerWidth / SQUARE_UNIT, window.innerHeight / SQUARE_UNIT);

		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;
		
		// draw the chess board in the center of the canvas
		let isDarkSquare = false;
		for (let i = 0; i < SQUARE_UNIT; i++) {
			for (let j = 0; j < SQUARE_UNIT; j++) {
				p5.fill(isDarkSquare ? colorUtil.hexToRGBColor("#2caf8e") : colorUtil.hexToRGBColor("#ffffff"));
				p5.rect(xOffset +  i * SQUARE_SIZE, yOffset +  j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
				const pieceImage = pieceToImageMap.get(chess.getPiece(i, j));
				if(pieceImage) {
					p5.image(pieceImage, xOffset +  i * SQUARE_SIZE, yOffset +  j * SQUARE_SIZE );
				}
				isDarkSquare = !isDarkSquare;
			}
			isDarkSquare = !isDarkSquare;
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
	}

	p5.setup = () => {
		setupCanvas();
	};


	p5.windowResized = () => {
		setupCanvas();
	};

	// The sketch draw method
	p5.draw = () => {
		p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
		setupChessBoard();
	};
};

new P5(sketch);
