import P5 from "p5";
type RGB = { r: number, g: number, b: number };
type HEX = `#${string}`;

export class ColorUtil {
    private p5: P5;

    constructor(p5: P5) {
        this.p5 = p5;
    }

    private hexToRGB(hex: HEX): RGB {
        const components: RGB = { r: 0, g: 0, b: 0 };
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        if (!result) return components;

        result[1] && (components.r = parseInt(result[1], 16));
        result[2] && (components.g = parseInt(result[2], 16));
        result[3] && (components.b = parseInt(result[3], 16));

        return components;
    }

    hexToRGBColor(hex: HEX): P5.Color {
        const rgb = this.hexToRGB(hex);
        return this.p5.color(rgb.r, rgb.g, rgb.b);
    }
}