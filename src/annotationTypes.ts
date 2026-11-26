import type React from "react";

export type AnnotationMode = "edit" | "view" | "hidden";
export type AnnotationHistoryMode = "local" | "external" | "disabled";

export type AnnotationTool =
  | "select"
  | "pen"
  | "arrow"
  | "line"
  | "highlighter"
  | "rectangle"
  | "ellipse"
  | "text"
  | "pin"
  | "callout";

interface BaseAnnotation {
  id: string;
  type:
    | "pen"
    | "arrow"
    | "line"
    | "highlighter"
    | "rectangle"
    | "ellipse"
    | "text"
    | "pin"
    | "callout";
  color: string;
  strokeWidth: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  textResizeMode?: "reflow" | "scale";
}

export interface PenAnnotation extends BaseAnnotation {
  type: "pen";
  points: number[];
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  points: [number, number, number, number];
}

export interface LineAnnotation extends BaseAnnotation {
  type: "line";
  points: [number, number, number, number];
}

export interface HighlighterAnnotation extends BaseAnnotation {
  type: "highlighter";
  points: number[];
  opacity: number;
}

export interface ShapeLabel {
  text: string;
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  padding: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  label?: ShapeLabel;
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  label?: ShapeLabel;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  width: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  align: "left" | "center" | "right";
}

export interface PinAnnotation extends BaseAnnotation {
  type: "pin";
  x: number;
  y: number;
  number: number;
  radius: number;
}

export interface CalloutAnnotation extends BaseAnnotation {
  type: "callout";
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  text: string;
  fillColor: string;
  fontSize: number;
}

export type Annotation =
  | PenAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | HighlighterAnnotation
  | RectangleAnnotation
  | EllipseAnnotation
  | TextAnnotation
  | PinAnnotation
  | CalloutAnnotation;

export interface AnnotationLayerProps {
  id?: string;
  mode?: AnnotationMode;
  tool?: AnnotationTool;
  annotations?: Annotation[];
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  selectedId?: string | null;
  history?: AnnotationHistoryMode;
  undoRequest?: number;
  redoRequest?: number;
  clearHistoryRequest?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
  style?: React.CSSProperties;
  setProps?: (props: Partial<AnnotationLayerProps>) => void;
}
