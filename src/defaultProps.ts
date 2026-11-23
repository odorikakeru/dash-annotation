import type { AnnotationLayerProps } from "./annotationTypes";

const defaultProps: Pick<
  AnnotationLayerProps,
  "mode" | "tool" | "annotations" | "color" | "strokeWidth" | "selectedId"
> = {
  mode: "view",
  tool: "select",
  annotations: [],
  color: "#e03131",
  strokeWidth: 3,
  selectedId: null,
};

export default defaultProps;
