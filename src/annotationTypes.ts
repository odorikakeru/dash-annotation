import type React from "react";

export type AnnotationMode = "edit" | "view" | "hidden";

export type AnnotationTool =
  | "select"
  | "pen"
  | "arrow"
  | "rectangle"
  | "ellipse";

interface BaseAnnotation {
  id: string;
  type: "pen" | "arrow" | "rectangle" | "ellipse";
  color: string;
  strokeWidth: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: "pen";
  points: number[];
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  points: [number, number, number, number];
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

export type Annotation =
  | PenAnnotation
  | ArrowAnnotation
  | RectangleAnnotation
  | EllipseAnnotation;

export interface AnnotationLayerProps {
  id?: string;
  mode?: AnnotationMode;
  tool?: AnnotationTool;
  annotations?: Annotation[];
  color?: string;
  strokeWidth?: number;
  selectedId?: string | null;
  className?: string;
  style?: React.CSSProperties;
  setProps?: (props: Partial<AnnotationLayerProps>) => void;
}
