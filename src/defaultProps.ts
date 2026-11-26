import type { AnnotationLayerProps } from "./annotationTypes";

const defaultProps: Pick<
  AnnotationLayerProps,
  | "mode"
  | "tool"
  | "annotations"
  | "color"
  | "strokeWidth"
  | "fontSize"
  | "selectedId"
  | "history"
  | "undoRequest"
  | "redoRequest"
  | "clearHistoryRequest"
  | "canUndo"
  | "canRedo"
> = {
  mode: "view",
  tool: "select",
  annotations: [],
  color: "#e03131",
  strokeWidth: 3,
  fontSize: 18,
  selectedId: null,
  history: "local",
  undoRequest: 0,
  redoRequest: 0,
  clearHistoryRequest: 0,
  canUndo: false,
  canRedo: false,
};

export default defaultProps;
