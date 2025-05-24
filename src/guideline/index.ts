import { Line, type Canvas, type FabricObject } from "fabric";

const SNAPPING_DISTANCE = 180;
const DEFAULT_STROKE_COLOR = "#ff4444";

type strokeOptionProps = Partial<{
  lineColor: string;
  lineWidth: number;
  canvasCenterLine: boolean;
  opacity: number;
  strokeDashArray: number[];
}>;
export class GuideLine {
  private canvas: Canvas;
  private strokeOption?: strokeOptionProps;

  constructor(canvas: Canvas, strokeOption?: strokeOptionProps) {
    this.canvas = canvas;
    this.strokeOption = {
      lineColor: strokeOption?.lineColor ?? DEFAULT_STROKE_COLOR,
      lineWidth: strokeOption?.lineWidth ?? 1,
      canvasCenterLine: strokeOption?.canvasCenterLine ?? true,
      opacity: strokeOption?.opacity ?? 1,
      strokeDashArray: strokeOption?.strokeDashArray ?? [5, 5],
    };
  }

  init() {
    this.canvas.on("selection:updated", () => this.clearGuideLine());
    this.canvas.on("object:moving", ({ target }) =>
      this.handleObjectMoving(target)
    );
    this.canvas.on("object:scaling", ({ target }) =>
      this.handleObjectMoving(target)
    );
    this.canvas.on("mouse:up", () => this.clearGuideLine());
  }

  private handleObjectMoving(selectedObject: FabricObject) {
    const right =
      selectedObject.left + selectedObject.width * selectedObject.scaleX;
    const bottom =
      selectedObject.top + selectedObject.height * selectedObject.scaleY;

    this.clearGuideLine();

    if (Math.abs(selectedObject.left) < this.canvas.width) {
      this.createVerticalLine(selectedObject.left);
      this.createVerticalLine(right);
      // object vertical center
      if (selectedObject.scaleX > 0.4) {
        this.createVerticalLine((selectedObject.left + right) / 2);
      }

      // CANVAS VERTICAL CENTER LINE
      if (
        this.strokeOption?.canvasCenterLine &&
        Math.abs(this.canvas.width / 2 - selectedObject.left) <
          SNAPPING_DISTANCE
      )
        this.createVerticalLine(this.canvas.width / 2);
    }

    if (Math.abs(selectedObject.top) < this.canvas.height) {
      this.createHorizontalLine(selectedObject.top);
      this.createHorizontalLine(bottom);

      // object horizontal center
      if (selectedObject.scaleY > 0.4) {
        this.createHorizontalLine((selectedObject.top + bottom) / 2);
      }

      // CANVAS HORIZONTAL CENTER LINE
      if (
        this.strokeOption?.canvasCenterLine &&
        Math.abs(this.canvas.height / 2 - selectedObject.top) <
          SNAPPING_DISTANCE
      )
        this.createHorizontalLine(this.canvas.height / 2);
    }
  }

  private createVerticalLine(x: number) {
    const line = new Line([x, 0, x, this.canvas?.height], {
      id: "vertical-",
      stroke: this.strokeOption?.lineColor,
      strokeWidth: this.strokeOption?.lineWidth,
      selectable: false,
      evented: false,
      strokeDashArray: this.strokeOption?.strokeDashArray,
      opacity: this.strokeOption?.opacity,
    });

    this.canvas.add(line);
    this.canvas.renderAll();
  }

  private createHorizontalLine(x: number) {
    if (!this.canvas) return;
    const line = new Line([0, x, this.canvas.width, x], {
      id: "horizontal-",
      stroke: this.strokeOption?.lineColor,
      strokeWidth: this.strokeOption?.lineWidth,
      selectable: false,
      evented: false,
      strokeDashArray: this.strokeOption?.strokeDashArray,
      opacity: this.strokeOption?.opacity,
    });
    this.canvas.add(line);
    this.canvas.renderAll();
  }

  private clearGuideLine() {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects("line");
    obj.forEach((obj) => {
      if (
        /line/i.test(obj.type) &&
        (obj as FabricObject & { id: string }).id &&
        ((obj as FabricObject & { id: string }).id.includes("vertical-") ||
          (obj as FabricObject & { id: string }).id.includes("horizontal-"))
      ) {
        this.canvas.remove(obj);
      }
    });

    this.canvas.renderAll();
  }
}
