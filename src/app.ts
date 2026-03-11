import P5 from "p5";
import "p5/lib/addons/p5.dom";
import "p5/lib/addons/p5.sound";
import { ColorUtil } from "./utils/color";

const sketch = (p5: P5) => {
	let canvas: P5.Renderer;
	let colorUtil: ColorUtil = new ColorUtil(p5);

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
				p5.fill(isDarkSquare ? colorUtil.hexToRGBColor("#000000") : colorUtil.hexToRGBColor("#ffffff"));
				p5.rect(xOffset +  i * SQUARE_SIZE, yOffset +  j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
				isDarkSquare = !isDarkSquare;
			}
			isDarkSquare = !isDarkSquare;
		}
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
