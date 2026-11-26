import type {
  Annotation,
  ArrowAnnotation,
  HighlighterAnnotation,
  LineAnnotation,
  PenAnnotation,
} from "./annotationTypes";

export interface AnnotationBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function annotationBounds(annotation: Annotation): AnnotationBounds {
  if (
    annotation.type === "pen" ||
    annotation.type === "arrow" ||
    annotation.type === "line" ||
    annotation.type === "highlighter"
  ) {
    const xs = annotation.points.filter((_, index) => index % 2 === 0);
    const ys = annotation.points.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(1, Math.max(...xs) - minX),
      height: Math.max(1, Math.max(...ys) - minY),
    };
  }
  if (annotation.type === "ellipse") {
    return {
      x: annotation.x - annotation.radiusX,
      y: annotation.y - annotation.radiusY,
      width: annotation.radiusX * 2,
      height: annotation.radiusY * 2,
    };
  }
  if (annotation.type === "pin") {
    return {
      x: annotation.x - annotation.radius,
      y: annotation.y - annotation.radius,
      width: annotation.radius * 2,
      height: annotation.radius * 2,
    };
  }
  if (annotation.type === "text") {
    const lines = Math.max(1, annotation.text.split("\n").length);
    return {
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: lines * annotation.fontSize * 1.3,
    };
  }
  return {
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
  };
}

export function annotationCenter(annotation: Annotation): {
  x: number;
  y: number;
} {
  const bounds = annotationBounds(annotation);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

export function movedAnnotation(
  annotation: Annotation,
  x: number,
  y: number,
): Annotation {
  if (
    annotation.type === "pen" ||
    annotation.type === "arrow" ||
    annotation.type === "line" ||
    annotation.type === "highlighter"
  ) {
    const points = annotation.points.map((value, index) =>
      value + (index % 2 ? y : x),
    );
    return { ...annotation, points } as
      | PenAnnotation
      | ArrowAnnotation
      | LineAnnotation
      | HighlighterAnnotation;
  }
  if (annotation.type === "callout") {
    return {
      ...annotation,
      x: annotation.x + x,
      y: annotation.y + y,
      anchorX: annotation.anchorX + x,
      anchorY: annotation.anchorY + y,
    };
  }
  return { ...annotation, x: annotation.x + x, y: annotation.y + y };
}

export function isDegenerateAnnotation(annotation: Annotation): boolean {
  switch (annotation.type) {
    case "pen":
    case "highlighter":
      return annotation.points.length < 4;
    case "arrow":
    case "line":
      return (
        annotation.points[0] === annotation.points[2] &&
        annotation.points[1] === annotation.points[3]
      );
    case "rectangle":
    case "callout":
      return annotation.width < 1 || annotation.height < 1;
    case "ellipse":
      return annotation.radiusX < 1 || annotation.radiusY < 1;
    case "text":
    case "pin":
      return false;
  }
}
