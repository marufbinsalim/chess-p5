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
	let selectedPiece: { x: number, y: number } | null = null;
	let availableMoves: Array<{
		x: number;
		y: number;
		secondary?: { fromX: number; fromY: number; toX: number; toY: number } | undefined;
		promotion?: boolean;
	}> = [];
	let animatedPieces: Array<{
		fromX: number, fromY: number,
		toX: number, toY: number,
		progress: number,
		piece: string
	}> = [];

	// Board spin animation state
	let spinAnimationProgress: number = 0; // 0 = no spin, 1 = completed spin
	let isSpinning: boolean = false;
	let targetOrientation: boolean = false; // Target orientation after spin

	// Get current board orientation (true = white's perspective, false = black's perspective)
	const getIsBoardReversed = (): boolean => {
		return chess.getWhiteTurn();
	};

	// Start board spin animation
	const startSpinAnimation = () => {
		isSpinning = true;
		spinAnimationProgress = 0;
		targetOrientation = getIsBoardReversed();
	};

	// Update spin animation
	const updateSpinAnimation = () => {
		if (isSpinning) {
			spinAnimationProgress += 0.05;
			if (spinAnimationProgress >= 1) {
				spinAnimationProgress = 1;
				isSpinning = false;
			}
		}
	};

	// Calculate current orientation based on spin progress
	const getCurrentOrientation = (): boolean => {
		// If not spinning, use actual orientation
		if (!isSpinning) {
			return getIsBoardReversed();
		}
		// During spin, use target orientation
		return targetOrientation;
	};

	// Translate board coordinates based on current orientation (including spin state)
	const translateBoardCoords = (x: number, y: number): { x: number; y: number } => {
		if (getCurrentOrientation()) {
			return {
				x: 7 - x,
				y: 7 - y
			};
		}
		return { x, y };
	};

	// Translate screen coordinates to board coordinates based on orientation
	const screenToBoardCoords = (screenX: number, screenY: number, xOffset: number, yOffset: number, squareSize: number): { x: number; y: number } => {
		let boardX = Math.floor((screenX - xOffset) / squareSize);
		let boardY = Math.floor((screenY - yOffset) / squareSize);
		
		return translateBoardCoords(boardX, boardY);
	};

	let pendingPromotion: { fromX: number; fromY: number; toX: number; toY: number } | null = null;
	let moveSound: P5.SoundFile;
	let captureSound: P5.SoundFile;

	function setupCanvas() {
		if (!canvas) canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight);
		canvas.parent("app");
		p5.resizeCanvas(window.innerWidth, window.innerHeight);
		p5.background(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.noStroke();
		return canvas;
	}

	function setupChessBoard() {
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min((window.innerWidth - 200) / SQUARE_UNIT, (window.innerHeight - 400) / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;

		// Apply spin transformation
		if (isSpinning) {
			p5.push();
			const centerX = xOffset + totalWidth / 2;
			const centerY = yOffset + totalWidth / 2;
			p5.translate(centerX, centerY);
			
			// Calculate spin angle (smooth easing)
			const easeProgress = 1 - Math.pow(1 - spinAnimationProgress, 3); // Ease out cubic
			const spinAngle = easeProgress * Math.PI; // 180 degrees spin
			p5.rotate(spinAngle);
			
			p5.translate(-centerX, -centerY);
		}

		let isDarkSquare = false;
		for (let i = 0; i < SQUARE_UNIT; i++) {
			for (let j = 0; j < SQUARE_UNIT; j++) {
				const { x: boardX, y: boardY } = translateBoardCoords(i, j);
				
				p5.fill(isDarkSquare ? colorUtil.hexToRGBColor("#b17b58") : colorUtil.hexToRGBColor("#ffffff"));
				p5.rect(xOffset + i * SQUARE_SIZE, yOffset + j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

				const pieceImage = pieceToImageMap.get(chess.getPiece(boardX, boardY));
				const isAnimated = animatedPieces.some(anim => anim.fromX === boardX && anim.fromY === boardY);
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
				const { x: displayX, y: displayY } = translateBoardCoords(move.x, move.y);
				p5.ellipse(
					xOffset + displayX * SQUARE_SIZE + SQUARE_SIZE / 2,
					yOffset + displayY * SQUARE_SIZE + SQUARE_SIZE / 2,
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
				const { x: fromDisplayX, y: fromDisplayY } = translateBoardCoords(animatedPiece.fromX, animatedPiece.fromY);
				const { x: toDisplayX, y: toDisplayY } = translateBoardCoords(animatedPiece.toX, animatedPiece.toY);
				
				const currentX = xOffset + (fromDisplayX + (toDisplayX - fromDisplayX) * animatedPiece.progress) * SQUARE_SIZE;
				const currentY = yOffset + (fromDisplayY + (toDisplayY - fromDisplayY) * animatedPiece.progress) * SQUARE_SIZE;
				p5.image(pieceImage, currentX, currentY, SQUARE_SIZE * 0.9, SQUARE_SIZE * 0.9);
			}
		}

		// Draw UI elements
		drawTurnIndicator();
		drawCapturedPieces(xOffset, yOffset, SQUARE_SIZE);
		drawGameStatus();
	}

	function drawTurnIndicator() {
		if(isSpinning) return;
		const turnText = chess.getWhiteTurn() ? "White's Turn" : "Black's Turn";

		p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.rect(0, 0, p5.width, 100);

		p5.textSize(50);
		p5.textStyle(p5.BOLD);
		p5.textFont("Courier");

		p5.fill(colorUtil.hexToRGBColor("#000000"));
		p5.textAlign(p5.CENTER, p5.CENTER);

		p5.text(turnText, p5.width / 2, 50);
	}

	function drawCapturedPieces(xOffset: number, yOffset: number, SQUARE_SIZE: number) {
		if(isSpinning) return;
		// Draw white captured pieces (bottom of the board)
		p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.rect(xOffset, yOffset + 8 * SQUARE_SIZE, 8 * SQUARE_SIZE, SQUARE_SIZE * 0.8);

		let whiteCaptureX = xOffset + SQUARE_SIZE * 0.5;
		for (const piece of chess.getCapturedWhitePieces()) {
			const pieceName = chess.getPieceName(piece);
			const pieceImage = pieceToImageMap.get(pieceName);
			if (pieceImage) {
				p5.image(pieceImage, whiteCaptureX, yOffset + 8 * SQUARE_SIZE + SQUARE_SIZE * 0.1, SQUARE_SIZE * 0.6, SQUARE_SIZE * 0.6);
				whiteCaptureX += SQUARE_SIZE * 0.7;
			}
		}

		// Draw black captured pieces (top of the board)
		p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.rect(xOffset, yOffset - SQUARE_SIZE * 0.8, 8 * SQUARE_SIZE, SQUARE_SIZE * 0.8);

		let blackCaptureX = xOffset + SQUARE_SIZE * 0.5;
		for (const piece of chess.getCapturedBlackPieces()) {
			const pieceName = chess.getPieceName(piece);
			const pieceImage = pieceToImageMap.get(pieceName);
			if (pieceImage) {
				p5.image(pieceImage, blackCaptureX, yOffset - SQUARE_SIZE * 0.7, SQUARE_SIZE * 0.6, SQUARE_SIZE * 0.6);
				blackCaptureX += SQUARE_SIZE * 0.7;
			}
		}
	}

	function drawGameStatus() {
		if(isSpinning) return;
		let statusText = "";
		let textColor = colorUtil.hexToRGBColor("#000000");

		if (chess.isCheckmate()) {
			statusText = chess.getWhiteTurn()
				? "Black wins by checkmate!"
				: "White wins by checkmate!";
			textColor = colorUtil.hexToRGBColor("#ff0000");
		} else if (chess.isStalemate()) {
			statusText = "Stalemate!";
			textColor = colorUtil.hexToRGBColor("#ff8800");
		} else if (chess.isDraw()) {
			statusText = "Draw!";
			textColor = colorUtil.hexToRGBColor("#ff8800");
		} else if (chess.isInCheck(chess.getWhiteTurn())) {
			statusText = "Check!";
			textColor = colorUtil.hexToRGBColor("#ff0000");
		}

		if (!statusText) return;

		p5.fill(colorUtil.hexToRGBColor("#dbdbdb"));
		p5.rect(0, 0, p5.width, 100);

		p5.textSize(50);
		p5.textStyle(p5.BOLD);
		p5.textFont("Courier");

		p5.fill(textColor);
		p5.textAlign(p5.CENTER, p5.CENTER);

		p5.text(statusText, p5.width / 2, 50);
	}
	function drawPromotionUI(promotion: { fromX: number; fromY: number; toX: number; toY: number }) {
		const SQUARE_UNIT = 8;
		const SQUARE_SIZE = Math.min((window.innerWidth - 200) / SQUARE_UNIT, (window.innerHeight - 400) / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;

		// Determine promotion type based on where the pawn moved (white pawn moves to y=7, black to y=0)
		const isWhite = promotion.toY === 7;
		const promotionPieces = isWhite
			? [Chess.PIECES.WHITE_QUEEN, Chess.PIECES.WHITE_ROOK, Chess.PIECES.WHITE_BISHOP, Chess.PIECES.WHITE_KNIGHT]
			: [Chess.PIECES.BLACK_QUEEN, Chess.PIECES.BLACK_ROOK, Chess.PIECES.BLACK_BISHOP, Chess.PIECES.BLACK_KNIGHT];

		// Position promotion UI inside the board bounds - translate to display coordinates
		const { x: displayToX, y: displayToY } = translateBoardCoords(promotion.toX, promotion.toY);
		let promotionX = xOffset + displayToX * SQUARE_SIZE;
		let promotionY = yOffset + displayToY * SQUARE_SIZE;

		// Adjust promotion UI position to stay within board
		if (isWhite) {
			// White pawn promotion (at top), show UI below
			if (displayToY + 3 > 7) {
				promotionY = yOffset + (displayToY - 3) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (displayToY + 1) * SQUARE_SIZE;
			}
		} else {
			// Black pawn promotion (at bottom), show UI above
			if (displayToY - 3 < 0) {
				promotionY = yOffset + (displayToY + 1) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (displayToY - 3) * SQUARE_SIZE;
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
		const SQUARE_SIZE = Math.min((window.innerWidth - 200) / SQUARE_UNIT, (window.innerHeight - 400) / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;

		// Determine promotion type based on where the pawn moved (white pawn moves to y=7, black to y=0)
		const isWhite = pendingPromotion.toY === 7;
		const promotionPieces = isWhite
			? [Chess.PIECES.WHITE_QUEEN, Chess.PIECES.WHITE_ROOK, Chess.PIECES.WHITE_BISHOP, Chess.PIECES.WHITE_KNIGHT]
			: [Chess.PIECES.BLACK_QUEEN, Chess.PIECES.BLACK_ROOK, Chess.PIECES.BLACK_BISHOP, Chess.PIECES.BLACK_KNIGHT];

		// Position promotion UI inside the board bounds - translate to display coordinates
		const { x: displayToX, y: displayToY } = translateBoardCoords(pendingPromotion.toX, pendingPromotion.toY);
		let promotionX = xOffset + displayToX * SQUARE_SIZE;
		let promotionY = yOffset + displayToY * SQUARE_SIZE;

		// Adjust promotion UI position to stay within board
		if (isWhite) {
			// White pawn promotion (at top), show UI below
			if (displayToY + 3 > 7) {
				promotionY = yOffset + (displayToY - 3) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (displayToY + 1) * SQUARE_SIZE;
			}
		} else {
			// Black pawn promotion (at bottom), show UI above
			if (displayToY - 3 < 0) {
				promotionY = yOffset + (displayToY + 1) * SQUARE_SIZE;
			} else {
				promotionY = yOffset + (displayToY - 3) * SQUARE_SIZE;
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
		
		// Update spin animation
		updateSpinAnimation();
		
		setupChessBoard();

		// Pop spin transformation if active
		if (isSpinning) {
			p5.pop();
		}

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
				
				// Start spin animation for board reversal
				startSpinAnimation();
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
		const SQUARE_SIZE = Math.min((window.innerWidth - 200) / SQUARE_UNIT, (window.innerHeight - 400) / SQUARE_UNIT);
		const totalWidth = SQUARE_SIZE * SQUARE_UNIT;
		const xOffset = (window.innerWidth - totalWidth) / 2;
		const yOffset = (window.innerHeight - totalWidth) / 2;

		const { x: boardX, y: boardY } = screenToBoardCoords(p5.mouseX, p5.mouseY, xOffset, yOffset, SQUARE_SIZE);

		// Check if click is on the chess board
		if (boardX >= 0 && boardX < 8 && boardY >= 0 && boardY < 8) {
			if (!selectedPiece) {
				// Try to select a piece
				if (chess.getPiece(boardX, boardY) !== "EMPTY") {
					selectedPiece = { x: boardX, y: boardY };
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
						selectedPiece = { x: boardX, y: boardY };
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
