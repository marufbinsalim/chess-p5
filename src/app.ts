import P5 from "p5";
import "p5/lib/addons/p5.dom";
import "p5/lib/addons/p5.sound";
import { ColorUtil } from "./utils/color";
import { Chess } from "./utils/chess";

// Import assets
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
import moveSoundFile from "../assets/move.mp3";
import captureSoundFile from "../assets/capture.mp3";

const sketch = (p5: P5) => {
	let canvas: P5.Renderer;
	const chess = new Chess();
	let colorUtil: ColorUtil = new ColorUtil(p5);

	let pieceToImageMap = new Map<string, P5.Image>();
	let selectedPiece: {x: number, y: number} | null = null;
	let availableMoves: Array<{
		x: number; 
		y: number; 
		secondary?: {fromX: number; fromY: number; toX: number; toY: number} | undefined;
		promotion?: boolean;
	}> = [];
	let animatedPieces: Array<{
		fromX: number, fromY: number,
		toX: number, toY: number,
		progress: number,
		piece: string
	}> = [];
	
	let pendingPromotion: {fromX: number; fromY: number; toX: number; toY: number} | null = null;
	let moveSound: P5.SoundFile;
	let captureSound: P5.SoundFile;

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
				const isAnimated = animatedPieces.some(anim => anim.fromX === i && anim.fromY === j);
				if (pieceImage && !isAnimated) {
					p5.image(pieceImage, xOffset + i * SQUARE_SIZE, yOffset + j * SQUARE_SIZE, SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9);
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

		// Draw promotion UI if pending
		if (pendingPromotion) {
			drawPromotionUI(pendingPromotion);
		}
		
		// Draw animated pieces
		for (const animatedPiece of animatedPieces) {
			const pieceImage = pieceToImageMap.get(animatedPiece.piece);
			if (pieceImage) {
				const currentX = xOffset + (animatedPiece.fromX + (animatedPiece.toX - animatedPiece.fromX) * animatedPiece.progress) * SQUARE_SIZE;
				const currentY = yOffset + (animatedPiece.fromY + (animatedPiece.toY - animatedPiece.fromY) * animatedPiece.progress) * SQUARE_SIZE;
				p5.image(pieceImage, currentX, currentY, SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9);
			}
		}
	}
	
	function drawPromotionUI(promotion: {fromX: number; fromY: number; toX: number; toY: number}) {
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min(window.innerWidth / SQUARE_UNIT, window.innerHeight / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;
		
		// Determine promotion type based on where the pawn moved (white pawn moves to y=7, black to y=0)
		const isWhite = promotion.toY === 7;
		const promotionPieces = isWhite 
			? [Chess.PIECES.WHITE_QUEEN, Chess.PIECES.WHITE_ROOK, Chess.PIECES.WHITE_BISHOP, Chess.PIECES.WHITE_KNIGHT]
			: [Chess.PIECES.BLACK_QUEEN, Chess.PIECES.BLACK_ROOK, Chess.PIECES.BLACK_BISHOP, Chess.PIECES.BLACK_KNIGHT];
		
		// Position promotion UI inside the board bounds
		let promotionX = xOffset + promotion.toX * SQUARE_SIZE;
		let promotionY = yOffset + promotion.toY * SQUARE_SIZE;
		
		// Adjust promotion UI position to stay within board
		if (isWhite) {
			// White pawn promotion (at top), show UI below
			if (promotion.toY + 3 > 7) {
				promotionY = yOffset + (promotion.toY - 3) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (promotion.toY + 1) * SQUARE_SIZE;
			}
		} else {
			// Black pawn promotion (at bottom), show UI above
			if (promotion.toY - 3 < 0) {
				promotionY = yOffset + (promotion.toY + 1) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (promotion.toY - 3) * SQUARE_SIZE;
			}
		}
		
		// Draw promotion background
		p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.stroke(0);
		p5.strokeWeight(2);
		p5.rect(promotionX, promotionY, SQUARE_SIZE, SQUARE_SIZE * 4);
		
		// Draw promotion pieces
		for (let i = 0; i < promotionPieces.length; i++) {
			const piece = promotionPieces[i];
			const pieceImage = piece && pieceToImageMap.get(chess.getPieceName(piece));
			if (pieceImage) {
				const pieceY = promotionY + i * SQUARE_SIZE;
				p5.image(pieceImage, promotionX, pieceY, SQUARE_SIZE, SQUARE_SIZE);
			}
		}
	}
	
	function handlePromotionClick(boardX: number, boardY: number) {
		if (!pendingPromotion) return false;
		
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min(window.innerWidth / SQUARE_UNIT, window.innerHeight / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;
		
		// Determine promotion type based on where the pawn moved (white pawn moves to y=7, black to y=0)
		const isWhite = pendingPromotion.toY === 7;
		const promotionPieces = isWhite 
			? [Chess.PIECES.WHITE_QUEEN, Chess.PIECES.WHITE_ROOK, Chess.PIECES.WHITE_BISHOP, Chess.PIECES.WHITE_KNIGHT]
			: [Chess.PIECES.BLACK_QUEEN, Chess.PIECES.BLACK_ROOK, Chess.PIECES.BLACK_BISHOP, Chess.PIECES.BLACK_KNIGHT];
		
		// Position promotion UI inside the board bounds
		let promotionX = xOffset + pendingPromotion.toX * SQUARE_SIZE;
		let promotionY = yOffset + pendingPromotion.toY * SQUARE_SIZE;
		
		// Adjust promotion UI position to stay within board
		if (isWhite) {
			// White pawn promotion (at top), show UI below
			if (pendingPromotion.toY + 3 > 7) {
				promotionY = yOffset + (pendingPromotion.toY - 3) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (pendingPromotion.toY + 1) * SQUARE_SIZE;
			}
		} else {
			// Black pawn promotion (at bottom), show UI above
			if (pendingPromotion.toY - 3 < 0) {
				promotionY = yOffset + (pendingPromotion.toY + 1) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (pendingPromotion.toY - 3) * SQUARE_SIZE;
			}
		}
		
		// Check if click is on promotion UI
		for (let i = 0; i < promotionPieces.length; i++) {
			const pieceY = promotionY + i * SQUARE_SIZE;
			const pieceX = promotionX;
			
			const mouseX = p5.mouseX;
			const mouseY = p5.mouseY;
			
			if (mouseX >= pieceX && mouseX <= pieceX + SQUARE_SIZE &&
			    mouseY >= pieceY && mouseY <= pieceY + SQUARE_SIZE) {
				// Select promotion piece
				const selectedPieceType = promotionPieces[i];
				
				// Replace the temporary queen with the selected promotion piece
				const index = pendingPromotion.toX + pendingPromotion.toY * 8;
				if (selectedPieceType !== undefined) {
					chess.board[index] = selectedPieceType;
				}
				
				pendingPromotion = null;
				return true;
			}
		}
		
		return false;
	}

	p5.preload = () => {
		pieceToImageMap.set("wP", p5.loadImage(wP));
		pieceToImageMap.set("bP", p5.loadImage(bP));
		pieceToImageMap.set("wK", p5.loadImage(wK));
		pieceToImageMap.set("bK", p5.loadImage(bK));
		pieceToImageMap.set("wB", p5.loadImage(wB));
		pieceToImageMap.set("bB", p5.loadImage(bB));
		pieceToImageMap.set("wR", p5.loadImage(wR));
		pieceToImageMap.set("bR", p5.loadImage(bR));
		pieceToImageMap.set("wQ", p5.loadImage(wQ));
		pieceToImageMap.set("bQ", p5.loadImage(bQ));
		pieceToImageMap.set("wN", p5.loadImage(wN));
		pieceToImageMap.set("bN", p5.loadImage(bN));
		
		// Load audio files
		moveSound = p5.loadSound(moveSoundFile);
		captureSound = p5.loadSound(captureSoundFile);
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

		// Update animations
		if (animatedPieces.length > 0) {
			let allAnimationsComplete = true;
			
			for (const animatedPiece of animatedPieces) {
				animatedPiece.progress += 0.05;
				if (animatedPiece.progress < 1) {
					allAnimationsComplete = false;
				}
			}

			if (allAnimationsComplete) {
				// All animations completed, finalize moves
				// For castling, we have two animated pieces: king and rook
				// We need to call movePiece once with the secondary move
				
				// Find if there's a main piece with secondary move (castling)
				let hasSecondaryMove = false;
				for (const animatedPiece of animatedPieces) {
					// Check if this piece has a corresponding secondary move in availableMoves
					const matchingMove = availableMoves.find(move => 
						move.x === animatedPiece.toX && move.y === animatedPiece.toY
					);
					
					if (matchingMove && matchingMove.secondary) {
						// Handle main piece with secondary move (castling)
						chess.movePiece(
							animatedPiece.fromX,
							animatedPiece.fromY,
							animatedPiece.toX,
							animatedPiece.toY,
							matchingMove.secondary
						);
						hasSecondaryMove = true;
						break;
					}
				}
				
				// If no secondary move (regular move), handle all animated pieces
				if (!hasSecondaryMove) {
					for (const animatedPiece of animatedPieces) {
						chess.movePiece(
							animatedPiece.fromX,
							animatedPiece.fromY,
							animatedPiece.toX,
							animatedPiece.toY
						);
					}
				}
				
				animatedPieces = [];
				selectedPiece = null;
				availableMoves = [];
			}
		}
	};

	function handleMouseClick() {
		// If there's a pending promotion, handle promotion click
		if (pendingPromotion) {
			const handled = handlePromotionClick(0, 0);
			if (handled) return;
		}
		
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
				const selectedMove = availableMoves.find(move => move.x === boardX && move.y === boardY);
				
				if (selectedMove) {
					// Determine if this move is a capture
					const isCapture = chess.getPiece(selectedMove.x, selectedMove.y) !== "EMPTY";
					const isEnPassant = chess.enPassantTarget && 
						selectedMove.x === chess.enPassantTarget.x && 
						selectedMove.y === chess.enPassantTarget.y;
					
					// Play appropriate sound
					if (isCapture || isEnPassant) {
						captureSound.play();
					} else {
						moveSound.play();
					}
					
					// Check if this is a promotion move
					if (selectedMove.promotion) {
						// Immediately move the pawn to the promotion square (will become queen temporarily)
						chess.movePiece(
							selectedPiece.x,
							selectedPiece.y,
							selectedMove.x,
							selectedMove.y,
							undefined,
							undefined // Default to queen temporarily
						);
						
						// Set pending promotion state
						pendingPromotion = {
							fromX: selectedPiece.x,
							fromY: selectedPiece.y,
							toX: selectedMove.x,
							toY: selectedMove.y
						};
						
						selectedPiece = null;
						availableMoves = [];
					} else {
						// Start animation(s) for non-promotion move
						animatedPieces = [];
						
						// Add main piece animation
						animatedPieces.push({
							fromX: selectedPiece.x,
							fromY: selectedPiece.y,
							toX: selectedMove.x,
							toY: selectedMove.y,
							progress: 0,
							piece: chess.getPiece(selectedPiece.x, selectedPiece.y)
						});
						
						// Add secondary piece animation if available (e.g., rook move during castling)
						if (selectedMove.secondary) {
							animatedPieces.push({
								fromX: selectedMove.secondary.fromX,
								fromY: selectedMove.secondary.fromY,
								toX: selectedMove.secondary.toX,
								toY: selectedMove.secondary.toY,
								progress: 0,
								piece: chess.getPiece(selectedMove.secondary.fromX, selectedMove.secondary.fromY)
							});
						}
					}
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
