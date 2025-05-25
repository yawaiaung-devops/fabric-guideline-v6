import { Line, type Canvas, type FabricObject } from "fabric";

const SNAPPING_DISTANCE = 180;

type strokeOptionProps = Partial<{
  lineColor: string;
  lineWidth: number;
  canvasCenterLine: boolean;
  opacity: number;
  strokeDashArray: number[];
  threshold: number;
  snapLineColor: string;
}>;

const DEFAULT_STROKE_OPTION: strokeOptionProps = {
  lineColor: "#ff4444",
  lineWidth: 1,
  canvasCenterLine: true,
  opacity: 1,
  strokeDashArray: [5, 5],
  threshold: 20,
  snapLineColor: "#1111ff",
};
export class GuideLine {
  private canvas: Canvas;
  private strokeOption?: strokeOptionProps;

  constructor(canvas: Canvas, strokeOption?: strokeOptionProps) {
    this.canvas = canvas;
    this.strokeOption = {
      ...DEFAULT_STROKE_OPTION,
      ...strokeOption,
    };
  }

  init() {
    this.canvas.on("selection:updated", () => this.clearGuideLine());
    this.canvas.on("object:moving", ({ target }) => {
      this.handleObjectMoving(target);
    });
    this.canvas.on("object:scaling", ({ target }) =>
      this.handleObjectMoving(target)
    );

    this.canvas.on("mouse:up", () => this.clearGuideLine());
  }

  private handleAroundObjectLine(target: FabricObject) {
    const snapThreshold = this.strokeOption?.threshold as number;
    const leftEdge = target.left;
    const topEdge = target.top;
    const rightEdge = target.left + target.width * target.scaleX;
    const bottomEdge = target.top + target.height * target.scaleY;
    const objects = this.canvas
      .getObjects()
      .filter((obj) => !/line/i.test(obj.type));

    const inThreshold = (a: number, b: number) =>
      Math.abs(a - b) <= snapThreshold;

    objects.forEach((obj) => {
      const objBottom = obj.top + obj.height * obj.scaleY;
      const verticalSnapLine = obj.top < target.top;
      const horizontalSnapLine = obj.left < target.left;
      const x2 = verticalSnapLine ? objBottom : obj.top;
      const y2 = verticalSnapLine ? obj.top + obj.height : obj.top - obj.height;

      if (objBottom < topEdge && inThreshold(topEdge, objBottom)) {
        this.createAroundLine(
          rightEdge,
          objBottom,
          obj.left + obj.width * obj.scaleX,
          objBottom
        );
      }

      if (leftEdge > obj.left && inThreshold(leftEdge, obj.left)) {
        // VERTICAL LINE FOR OBJECTS AROUND SELECT ELEMENTS
        this.createAroundLine(obj.left, x2, obj.left, y2);
      } else if (inThreshold(obj.left, rightEdge)) {
        // VERTICAL LINE FOR OBJECTS AROUND SELECT ELEMENTS
        this.createAroundLine(obj.left, x2, obj.left, y2);
      }

      if (inThreshold(topEdge, obj.top)) {
        // HORIZONTAL LINE FOR OBJECTS AROUND SELECT ELEMENTS
        if (horizontalSnapLine) {
          this.createAroundLine(rightEdge, obj.top, obj.left, obj.top);
        } else {
          this.createAroundLine(leftEdge, obj.top, obj.left, obj.top);
        }
      } else if (inThreshold(obj.top, bottomEdge)) {
        // HORIZONTAL LINE FOR OBJECTS AROUND SELECT ELEMENTS FOR BOTTOM
        if (horizontalSnapLine) {
          this.createAroundLine(rightEdge, obj.top, obj.left, obj.top);
        } else {
          this.createAroundLine(leftEdge, obj.top, obj.left, obj.top);
        }
      }
    });
  }

  private handleObjectMoving(selectedObject: FabricObject) {
    const left = selectedObject.left;
    const top = selectedObject.top;
    const right = left + selectedObject.width * selectedObject.scaleX;
    const bottom = top + selectedObject.height * selectedObject.scaleY;

    this.clearGuideLine();

    this.handleAroundObjectLine(selectedObject);

    if (Math.abs(left) < this.canvas.width) {
      this.createVerticalLine(left);
      this.createVerticalLine(right);
      // object vertical center
      if (selectedObject.scaleX > 0.4) {
        this.createVerticalLine((left + right) / 2);
      }

      // CANVAS VERTICAL CENTER LINE
      if (
        this.strokeOption?.canvasCenterLine &&
        Math.abs(this.canvas.width / 2 - left) < SNAPPING_DISTANCE
      )
        this.createVerticalLine(this.canvas.width / 2);
    }

    if (Math.abs(top) < this.canvas.height) {
      this.createHorizontalLine(top);
      this.createHorizontalLine(bottom);

      // object horizontal center
      if (selectedObject.scaleY > 0.4) {
        this.createHorizontalLine((top + bottom) / 2);
      }

      // CANVAS HORIZONTAL CENTER LINE
      if (
        this.strokeOption?.canvasCenterLine &&
        Math.abs(this.canvas.height / 2 - top) < SNAPPING_DISTANCE
      )
        this.createHorizontalLine(this.canvas.height / 2);
    }
  }

  private createVerticalLine(x: number) {
    const line = new Line([x, 0, x, this.canvas?.height], {
      id: "vertical-",
      ...this.strokeOption,
      stroke: this.strokeOption?.lineColor,
      strokeWidth: this.strokeOption?.lineWidth,
    });

    this.canvas.add(line);
    this.canvas.renderAll();
  }

  private createHorizontalLine(x: number) {
    if (!this.canvas) return;
    const line = new Line([0, x, this.canvas.width, x], {
      id: "horizontal-",
      ...this.strokeOption,
      stroke: this.strokeOption?.lineColor,
      strokeWidth: this.strokeOption?.lineWidth,
    });
    this.canvas.add(line);
    this.canvas.renderAll();
  }

  private createAroundLine(x1: number, y1: number, x2: number, y2: number) {
    const line = new Line([x1, y1, x2, y2], {
      id: "around",
      ...this.strokeOption,
      stroke: this.strokeOption?.snapLineColor,
      strokeWidth: this.strokeOption?.lineWidth,
    });
    this.canvas.add(line);
    this.canvas.renderAll();
  }

  private clearGuideLine() {
    const linesToRemove = this.canvas.getObjects("line").filter((obj) => {
      const id = (obj as FabricObject & { id?: string }).id;
      return (
        id?.includes("vertical-") ||
        id?.includes("horizontal-") ||
        id?.includes("around")
      );
    });

    linesToRemove.forEach((line) => this.canvas.remove(line));
    this.canvas.renderAll();
  }
}
