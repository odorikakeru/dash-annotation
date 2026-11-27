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
  | "persisted_props"
  | "persistence_type"
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
  persisted_props: ["annotations"],
  persistence_type: "local",
};

export default defaultProps;
