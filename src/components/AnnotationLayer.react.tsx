import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Circle,
  Ellipse,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import type {
  Annotation,
  AnnotationLayerProps,
  AnnotationMode,
  AnnotationTool,
  CalloutAnnotation,
  EllipseAnnotation,
  RectangleAnnotation,
  ShapeLabel,
  TextAnnotation,
} from "../annotationTypes";
import {
  annotationCenter,
  isDegenerateAnnotation,
  movedAnnotation,
} from "../annotationGeometry";
import defaultProps from "../defaultProps";

type DrawableTool = Exclude<AnnotationTool, "select" | "text" | "pin">;

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  tool: DrawableTool;
  annotation: Annotation;
}

interface ShapeProps {
  annotation: Annotation;
  mode: AnnotationMode;
  tool: AnnotationTool;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (annotation: Annotation, node: Konva.Node) => void;
  onTransformEnd: (annotation: Annotation, node: Konva.Node) => void;
  onEditText: (annotation: Annotation) => void;
  onNodeRef: (id: string, node: Konva.Node | null) => void;
}

interface TextEditorState {
  kind: "text" | "label" | "callout";
  annotation: TextAnnotation | RectangleAnnotation | EllipseAnnotation | CalloutAnnotation;
  value: string;
  isNew: boolean;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `annotation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeAnnotation(
  tool: DrawableTool,
  x: number,
  y: number,
  color: string,
  strokeWidth: number,
): Annotation {
  const base = { id: makeId(), color, strokeWidth };
  switch (tool) {
    case "pen":
      return { ...base, type: "pen", points: [x, y, x, y] };
    case "highlighter":
      return {
        ...base,
        type: "highlighter",
        points: [x, y, x, y],
        opacity: 0.35,
      };
    case "arrow":
      return { ...base, type: "arrow", points: [x, y, x, y] };
    case "line":
      return { ...base, type: "line", points: [x, y, x, y] };
    case "rectangle":
      return { ...base, type: "rectangle", x, y, width: 0, height: 0 };
    case "ellipse":
      return { ...base, type: "ellipse", x, y, radiusX: 0, radiusY: 0 };
    case "callout":
      return {
        ...base,
        type: "callout",
        x,
        y,
        width: 0,
        height: 0,
        anchorX: x,
        anchorY: y,
        text: "Callout",
        fillColor: "#ffffff",
        fontSize: 16,
      };
  }
}

function updateDraft(gesture: Gesture, x: number, y: number): Annotation {
  const { annotation } = gesture;
  if (annotation.type === "pen" || annotation.type === "highlighter") {
    return { ...annotation, points: [...annotation.points, x, y] };
  }
  if (annotation.type === "arrow" || annotation.type === "line") {
    return { ...annotation, points: [gesture.startX, gesture.startY, x, y] };
  }
  if (annotation.type === "rectangle") {
    return {
      ...annotation,
      x: Math.min(gesture.startX, x),
      y: Math.min(gesture.startY, y),
      width: Math.abs(x - gesture.startX),
      height: Math.abs(y - gesture.startY),
    };
  }
  if (annotation.type === "callout") {
    const width = Math.abs(x - gesture.startX);
    const height = Math.abs(y - gesture.startY);
    if (width < 1 || height < 1) return annotation;
    return {
      ...annotation,
      x:
        x >= gesture.startX
          ? gesture.startX + 24
          : x - 24,
      y:
        y >= gesture.startY
          ? gesture.startY + 24
          : y - 24,
      width: Math.max(120, width),
      height: Math.max(60, height),
    };
  }
  if (annotation.type === "ellipse") {
    return {
      ...annotation,
      x: (gesture.startX + x) / 2,
      y: (gesture.startY + y) / 2,
      radiusX: Math.abs(x - gesture.startX) / 2,
      radiusY: Math.abs(y - gesture.startY) / 2,
    };
  }
  return annotation;
}

function makeShapeLabel(color: string, fontSize: number): ShapeLabel {
  return {
    text: "Label",
    color,
    fontSize,
    align: "center",
    verticalAlign: "middle",
    padding: 8,
  };
}

function labelY(
  verticalAlign: ShapeLabel["verticalAlign"],
  y: number,
  height: number,
  padding: number,
): number {
  if (verticalAlign === "bottom") return y + height - padding - 24;
  if (verticalAlign === "middle") return y + (height - 24) / 2;
  return y + padding;
}

function contrastingTextColor(color: string): string {
  const normalized = color.replace("#", "");
  if (normalized.length !== 6) return "#ffffff";
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160
    ? "#111111"
    : "#ffffff";
}

function calloutConnector(annotation: CalloutAnnotation): [number, number] {
  const anchorX = annotation.anchorX - annotation.x;
  const anchorY = annotation.anchorY - annotation.y;
  const relativeX = anchorX - annotation.width / 2;
  const relativeY = anchorY - annotation.height / 2;
  const horizontal =
    Math.abs(relativeX) / Math.max(annotation.width, 1) >=
    Math.abs(relativeY) / Math.max(annotation.height, 1);
  if (horizontal) {
    return [
      relativeX < 0 ? 0 : annotation.width,
      Math.max(0, Math.min(annotation.height, anchorY)),
    ];
  }
  return [
    Math.max(0, Math.min(annotation.width, anchorX)),
    relativeY < 0 ? 0 : annotation.height,
  ];
}

function AnnotationShape({
  annotation,
  mode,
  tool,
  selected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onEditText,
  onNodeRef,
}: ShapeProps): React.ReactElement {
  const draggable = mode === "edit" && tool === "select";
  const center = annotationCenter(annotation);
  const eventProps = {
    draggable,
    listening: mode === "edit" && tool === "select",
    onClick: () => onSelect(annotation.id),
    onTap: () => onSelect(annotation.id),
    onDblClick: () => onEditText(annotation),
    onDblTap: () => onEditText(annotation),
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
      onDragEnd(annotation, event.target),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) =>
      onTransformEnd(annotation, event.target),
    shadowColor: selected ? "#228be6" : undefined,
    shadowBlur: selected ? 5 : 0,
  };
  const groupProps = {
    ...eventProps,
    ref: (node: Konva.Node | null) => onNodeRef(annotation.id, node),
    x: center.x,
    y: center.y,
    rotation: annotation.rotation ?? 0,
    scaleX: annotation.scaleX ?? 1,
    scaleY: annotation.scaleY ?? 1,
  };

  switch (annotation.type) {
    case "pen":
    case "highlighter":
      return (
        <Group {...groupProps}>
          <Line
            points={annotation.points.map((value, index) =>
              value - (index % 2 === 0 ? center.x : center.y),
            )}
            stroke={annotation.color}
            strokeWidth={
              annotation.type === "highlighter"
                ? Math.max(annotation.strokeWidth * 5, 14)
                : annotation.strokeWidth
            }
            opacity={annotation.type === "highlighter" ? annotation.opacity : 1}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={Math.max(annotation.strokeWidth, 10)}
          />
        </Group>
      );
    case "arrow":
      return (
        <Group {...groupProps}>
          <Arrow
            points={annotation.points.map((value, index) =>
              value - (index % 2 === 0 ? center.x : center.y),
            )}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            pointerLength={Math.max(8, annotation.strokeWidth * 3)}
            pointerWidth={Math.max(8, annotation.strokeWidth * 3)}
            hitStrokeWidth={Math.max(annotation.strokeWidth, 10)}
          />
        </Group>
      );
    case "line":
      return (
        <Group {...groupProps}>
          <Line
            points={annotation.points.map((value, index) =>
              value - (index % 2 === 0 ? center.x : center.y),
            )}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            lineCap="round"
            hitStrokeWidth={Math.max(annotation.strokeWidth, 10)}
          />
        </Group>
      );
    case "rectangle":
      return (
        <Group {...groupProps}>
          <Rect
            x={-annotation.width / 2}
            y={-annotation.height / 2}
            width={annotation.width}
            height={annotation.height}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            fill="rgba(0, 0, 0, 0.001)"
          />
          {annotation.label && (
            <Text
              x={-annotation.width / 2 + annotation.label.padding}
              y={
                labelY(
                  annotation.label.verticalAlign,
                  -annotation.height / 2,
                  annotation.height,
                  annotation.label.padding,
                )
              }
              width={Math.max(0, annotation.width - annotation.label.padding * 2)}
              height={Math.max(0, annotation.height - annotation.label.padding * 2)}
              text={annotation.label.text}
              fontSize={annotation.label.fontSize}
              fill={annotation.label.color}
              align={annotation.label.align}
              wrap="word"
              listening={false}
            />
          )}
        </Group>
      );
    case "ellipse": {
      const label = annotation.label;
      return (
        <Group {...groupProps}>
          <Ellipse
            radiusX={annotation.radiusX}
            radiusY={annotation.radiusY}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            fill="rgba(0, 0, 0, 0.001)"
          />
          {label && (
            <Text
              x={-annotation.radiusX + label.padding}
              y={labelY(
                label.verticalAlign,
                -annotation.radiusY,
                annotation.radiusY * 2,
                label.padding,
              )}
              width={Math.max(0, annotation.radiusX * 2 - label.padding * 2)}
              height={Math.max(0, annotation.radiusY * 2 - label.padding * 2)}
              text={label.text}
              fontSize={label.fontSize}
              fill={label.color}
              align={label.align}
              wrap="word"
              listening={false}
            />
          )}
        </Group>
      );
    }
    case "text":
      return (
        <Group {...groupProps}>
          <Text
            x={-annotation.width / 2}
            y={-((annotation.text.split("\n").length * annotation.fontSize * 1.3) / 2)}
            width={annotation.width}
            text={annotation.text}
            fontSize={annotation.fontSize}
            fontFamily={annotation.fontFamily}
            fill={annotation.color}
            align={annotation.align}
            wrap="word"
            hitStrokeWidth={10}
          />
        </Group>
      );
    case "pin":
      return (
        <Group {...groupProps}>
          <Circle
            radius={annotation.radius}
            fill={annotation.color}
            stroke="#ffffff"
            strokeWidth={Math.max(1, annotation.strokeWidth / 2)}
          />
          <Text
            x={-annotation.radius}
            y={-annotation.radius / 2}
            width={annotation.radius * 2}
            text={String(annotation.number)}
            align="center"
            fontStyle="bold"
            fontSize={annotation.radius}
            fill={contrastingTextColor(annotation.color)}
            listening={false}
          />
        </Group>
      );
    case "callout":
      const [connectorX, connectorY] = calloutConnector(annotation);
      const bodyX = -annotation.width / 2;
      const bodyY = -annotation.height / 2;
      return (
        <Group {...groupProps}>
          <Line
            points={[
              annotation.anchorX - center.x,
              annotation.anchorY - center.y,
              connectorX + bodyX,
              connectorY + bodyY,
            ]}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
            lineCap="round"
          />
          <Rect
            x={bodyX}
            y={bodyY}
            width={annotation.width}
            height={annotation.height}
            cornerRadius={8}
            fill={annotation.fillColor}
            stroke={annotation.color}
            strokeWidth={annotation.strokeWidth}
          />
          <Text
            x={bodyX + 8}
            y={bodyY + 8}
            width={Math.max(0, annotation.width - 16)}
            height={Math.max(0, annotation.height - 16)}
            text={annotation.text}
            fontSize={annotation.fontSize}
            fill={annotation.color}
            padding={0}
            wrap="word"
            listening={false}
          />
        </Group>
      );
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
    ),
  );
}

function AnnotationLayer({
  id,
  mode = defaultProps.mode!,
  tool = defaultProps.tool!,
  annotations = defaultProps.annotations!,
  color = defaultProps.color!,
  strokeWidth = defaultProps.strokeWidth!,
  fontSize = defaultProps.fontSize!,
  selectedId: selectedIdProp = defaultProps.selectedId,
  history = defaultProps.history!,
  undoRequest = defaultProps.undoRequest!,
  redoRequest = defaultProps.redoRequest!,
  clearHistoryRequest = defaultProps.clearHistoryRequest!,
  className,
  style,
  setProps,
}: AnnotationLayerProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef(new Map<string, Konva.Node>());
  const gestureRef = useRef<Gesture | null>(null);
  const textEditorRef = useRef<TextEditorState | null>(null);
  const textTimerRef = useRef<number | null>(null);
  const annotationsRef = useRef<Annotation[]>(annotations);
  const undoStackRef = useRef<Annotation[][]>([]);
  const redoStackRef = useRef<Annotation[][]>([]);
  const previousStyleRef = useRef({ color, fontSize });
  const previousRequestsRef = useRef({
    undo: undoRequest,
    redo: redoRequest,
    clear: clearHistoryRequest,
  });
  const selectedRef = useRef<string | null>(selectedIdProp ?? null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<Annotation | null>(null);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const [optimisticAnnotations, setOptimisticAnnotations] = useState<
    Annotation[] | null
  >(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedIdProp ?? null,
  );
  const annotationsSignature = useMemo(
    () => JSON.stringify(annotations),
    [annotations],
  );
  const renderedAnnotations = optimisticAnnotations ?? annotations;
  textEditorRef.current = textEditor;

  useEffect(() => {
    annotationsRef.current = annotations;
    setOptimisticAnnotations(null);
  }, [annotationsSignature]);

  useEffect(() => {
    const nextId = mode === "edit" ? (selectedIdProp ?? null) : null;
    selectedRef.current = nextId;
    setSelectedId(nextId);
    if (mode !== "edit" && selectedIdProp != null) {
      setProps?.({ selectedId: null });
    }
  }, [mode, selectedIdProp, setProps]);

  useEffect(() => {
    if (mode === "edit") return;
    if (textTimerRef.current != null) window.clearTimeout(textTimerRef.current);
    textTimerRef.current = null;
    gestureRef.current = null;
    setDraft(null);
    setTextEditor(null);
  }, [mode]);

  useEffect(() => {
    if (
      textEditorRef.current?.kind === "text" &&
      textEditorRef.current.isNew
    ) {
      changeSelection(null);
    }
    if (textTimerRef.current != null) window.clearTimeout(textTimerRef.current);
    textTimerRef.current = null;
    gestureRef.current = null;
    setDraft(null);
    setTextEditor(null);
  }, [tool]);

  useEffect(() => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;

    const measure = () => {
      setDimensions({
        width: parent.clientWidth,
        height: parent.clientHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const cloneAnnotations = useCallback(
    (items: Annotation[]) =>
      JSON.parse(JSON.stringify(items)) as Annotation[],
    [],
  );

  const publishHistoryState = useCallback(() => {
    const canUndo = history === "local" && undoStackRef.current.length > 0;
    const canRedo = history === "local" && redoStackRef.current.length > 0;
    setProps?.({ canUndo, canRedo });
  }, [history, setProps]);

  const commitAnnotations = useCallback(
    (next: Annotation[], recordHistory = true) => {
      if (JSON.stringify(next) === JSON.stringify(annotationsRef.current)) {
        return;
      }
      if (recordHistory && history === "local") {
        undoStackRef.current.push(cloneAnnotations(annotationsRef.current));
        if (undoStackRef.current.length > 100) undoStackRef.current.shift();
        redoStackRef.current = [];
      }
      annotationsRef.current = next;
      setOptimisticAnnotations(next);
      setProps?.({ annotations: next });
      publishHistoryState();
    },
    [cloneAnnotations, history, publishHistoryState, setProps],
  );

  const restoreHistory = useCallback(
    (source: Annotation[][], destination: Annotation[][]) => {
      const snapshot = source.pop();
      if (!snapshot) return;
      destination.push(cloneAnnotations(annotationsRef.current));
      changeSelection(null);
      commitAnnotations(cloneAnnotations(snapshot), false);
      publishHistoryState();
    },
    [cloneAnnotations, commitAnnotations, publishHistoryState],
  );

  const undo = useCallback(() => {
    if (history !== "local") return;
    restoreHistory(undoStackRef.current, redoStackRef.current);
  }, [history, restoreHistory]);

  const redo = useCallback(() => {
    if (history !== "local") return;
    restoreHistory(redoStackRef.current, undoStackRef.current);
  }, [history, restoreHistory]);

  const clearHistory = useCallback(() => {
    if (history !== "local") return;
    undoStackRef.current = [];
    redoStackRef.current = [];
    publishHistoryState();
  }, [history, publishHistoryState]);

  const changeSelection = useCallback(
    (nextId: string | null) => {
      if (selectedRef.current === nextId) return;
      selectedRef.current = nextId;
      setSelectedId(nextId);
      setProps?.({ selectedId: nextId });
    },
    [setProps],
  );

  useEffect(() => {
    if (history !== "local") {
      undoStackRef.current = [];
      redoStackRef.current = [];
    }
    publishHistoryState();
    previousRequestsRef.current = {
      undo: undoRequest,
      redo: redoRequest,
      clear: clearHistoryRequest,
    };
  }, [history]);

  useEffect(() => {
    const previous = previousRequestsRef.current;
    if (undoRequest !== previous.undo) undo();
    if (redoRequest !== previous.redo) redo();
    if (clearHistoryRequest !== previous.clear) clearHistory();
    previousRequestsRef.current = {
      undo: undoRequest,
      redo: redoRequest,
      clear: clearHistoryRequest,
    };
  }, [
    clearHistory,
    clearHistoryRequest,
    redo,
    redoRequest,
    undo,
    undoRequest,
  ]);

  const handlePointerDown = useCallback(
    (event: Konva.KonvaEventObject<PointerEvent>) => {
      event.evt.stopPropagation();
      if (mode !== "edit") return;
      const stage = event.target.getStage();
      if (!stage || event.target !== stage) return;
      const point = stage.getPointerPosition();
      if (!point) return;

      if (tool === "select") {
        changeSelection(null);
        return;
      }

      if (tool === "text") {
        const annotation: TextAnnotation = {
          id: makeId(),
          type: "text",
          x: point.x,
          y: point.y,
          width: 180,
          text: "",
          color,
          strokeWidth,
          fontSize,
          fontFamily: "Arial",
          align: "left",
        };
        changeSelection(annotation.id);
        if (textTimerRef.current != null) {
          window.clearTimeout(textTimerRef.current);
        }
        textTimerRef.current = window.setTimeout(() => {
          textTimerRef.current = null;
          setTextEditor({
            kind: "text",
            annotation,
            value: "",
            isNew: true,
          });
        }, 0);
        return;
      }

      if (tool === "pin") {
        const usedNumbers = new Set(
          annotationsRef.current
            .filter((annotation) => annotation.type === "pin")
            .map((annotation) => annotation.number),
        );
        let number = 1;
        while (usedNumbers.has(number)) number += 1;
        const annotation: Annotation = {
          id: makeId(),
          type: "pin",
          x: point.x,
          y: point.y,
          number,
          radius: 16,
          color,
          strokeWidth,
        };
        changeSelection(annotation.id);
        commitAnnotations([...annotationsRef.current, annotation]);
        return;
      }

      const annotation = makeAnnotation(
        tool,
        point.x,
        point.y,
        color,
        strokeWidth,
      );
      if (annotation.type === "callout") annotation.fontSize = fontSize;
      gestureRef.current = {
        pointerId: event.evt.pointerId,
        startX: point.x,
        startY: point.y,
        tool,
        annotation,
      };
      setDraft(annotation);
      const target = event.evt.target;
      if (event.evt.isTrusted && target instanceof HTMLCanvasElement) {
        target.setPointerCapture?.(event.evt.pointerId);
      }
    },
    [
      changeSelection,
      color,
      commitAnnotations,
      fontSize,
      mode,
      strokeWidth,
      tool,
    ],
  );

  const handlePointerMove = useCallback(
    (event: Konva.KonvaEventObject<PointerEvent>) => {
      event.evt.stopPropagation();
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.evt.pointerId) return;
      const point = event.target.getStage()?.getPointerPosition();
      if (point) {
        gesture.annotation = updateDraft(gesture, point.x, point.y);
        setDraft(gesture.annotation);
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: Konva.KonvaEventObject<PointerEvent>) => {
      event.evt.stopPropagation();
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.evt.pointerId) return;
      const point = event.target.getStage()?.getPointerPosition();
      const completed = point
        ? updateDraft(gesture, point.x, point.y)
        : gesture.annotation;
      gestureRef.current = null;
      setDraft(null);

      if (isDegenerateAnnotation(completed)) return;
      changeSelection(completed.id);
      commitAnnotations([...annotationsRef.current, completed]);
      if (completed.type === "callout") {
        setTextEditor({
          kind: "callout",
          annotation: completed,
          value: completed.text,
          isNew: false,
        });
      }
    },
    [changeSelection, commitAnnotations],
  );

  const handlePointerCancel = useCallback(
    (event: Konva.KonvaEventObject<PointerEvent>) => {
      event.evt.stopPropagation();
      if (gestureRef.current?.pointerId !== event.evt.pointerId) return;
      gestureRef.current = null;
      setDraft(null);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (annotation: Annotation, node: Konva.Node) => {
      const center = annotationCenter(annotation);
      const { x, y } = node.position();
      const deltaX = x - center.x;
      const deltaY = y - center.y;
      const next = annotationsRef.current.map((item) => {
        if (item.id !== annotation.id) return item;
        return movedAnnotation(item, deltaX, deltaY);
      });
      commitAnnotations(next);
    },
    [commitAnnotations],
  );

  const handleTransformEnd = useCallback(
    (annotation: Annotation, node: Konva.Node) => {
      const scaleX = Math.max(0.1, node.scaleX());
      const scaleY = Math.max(0.1, node.scaleY());
      const rotation = node.rotation();
      commitAnnotations(
        annotationsRef.current.map((item) =>
          item.id === annotation.id
            ? { ...item, scaleX, scaleY, rotation }
            : item,
        ),
      );
    },
    [commitAnnotations],
  );

  const handleNodeRef = useCallback(
    (annotationId: string, node: Konva.Node | null) => {
      if (node) nodeRefs.current.set(annotationId, node);
      else nodeRefs.current.delete(annotationId);
    },
    [],
  );

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const selectedNode = selectedId ? nodeRefs.current.get(selectedId) : null;
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, renderedAnnotations, tool, mode]);

  useEffect(() => {
    const previous = previousStyleRef.current;
    previousStyleRef.current = { color, fontSize };
    const selected = annotationsRef.current.find(
      (annotation) => annotation.id === selectedRef.current,
    );
    if (!selected || (previous.color === color && previous.fontSize === fontSize)) {
      return;
    }
    const next = annotationsRef.current.map((annotation) => {
      if (annotation.id !== selected.id) return annotation;
      const updated = {
        ...annotation,
        color: previous.color !== color ? color : annotation.color,
      };
      const colorChanged = previous.color !== color;
      if (previous.fontSize === fontSize) {
        if (
          colorChanged &&
          (annotation.type === "rectangle" || annotation.type === "ellipse") &&
          annotation.label
        ) {
          return {
            ...updated,
            label: { ...annotation.label, color },
          };
        }
        return updated;
      }
      if (annotation.type === "text" || annotation.type === "callout") {
        return { ...updated, fontSize };
      }
      if (
        (annotation.type === "rectangle" || annotation.type === "ellipse") &&
        annotation.label
      ) {
        return {
          ...updated,
          label: {
            ...annotation.label,
            color: colorChanged ? color : annotation.label.color,
            fontSize,
          },
        };
      }
      return updated;
    });
    commitAnnotations(next);
  }, [color, commitAnnotations, fontSize]);

  const handleEditText = useCallback(
    (annotation: Annotation) => {
      if (mode !== "edit" || tool !== "select") return;
      if (annotation.type === "text") {
        setTextEditor({
          kind: "text",
          annotation,
          value: annotation.text,
          isNew: false,
        });
      } else if (annotation.type === "callout") {
        setTextEditor({
          kind: "callout",
          annotation,
          value: annotation.text,
          isNew: false,
        });
      } else if (
        annotation.type === "rectangle" ||
        annotation.type === "ellipse"
      ) {
        const label = annotation.label ?? makeShapeLabel(color, fontSize);
        setTextEditor({
          kind: "label",
          annotation: { ...annotation, label },
          value: label.text,
          isNew: !annotation.label,
        });
      }
    },
    [color, fontSize, mode, tool],
  );

  const finishTextEdit = useCallback(() => {
    if (!textEditor) return;
    const { annotation, kind, value, isNew } = textEditor;
    const text = value.trimEnd();
    setTextEditor(null);

    if (kind === "text") {
      if (!text.trim()) {
        if (!isNew) {
          commitAnnotations(
            annotationsRef.current.filter((item) => item.id !== annotation.id),
          );
          changeSelection(null);
        }
        return;
      }
      const nextAnnotation = { ...(annotation as TextAnnotation), text };
      if (isNew) {
        commitAnnotations([...annotationsRef.current, nextAnnotation]);
      } else {
        commitAnnotations(
          annotationsRef.current.map((item) =>
            item.id === annotation.id ? nextAnnotation : item,
          ),
        );
      }
      return;
    }

    commitAnnotations(
      annotationsRef.current.map((item) => {
        if (item.id !== annotation.id) return item;
        if (kind === "callout" && item.type === "callout") {
          return { ...item, text };
        }
        if (item.type === "rectangle" || item.type === "ellipse") {
          const original = annotation as RectangleAnnotation | EllipseAnnotation;
          return {
            ...item,
            label: text.trim()
              ? {
                  ...(original.label ?? makeShapeLabel(color, fontSize)),
                  text,
                }
              : undefined,
          };
        }
        return item;
      }),
    );
  }, [changeSelection, color, commitAnnotations, fontSize, textEditor]);

  useEffect(() => {
    if (mode !== "edit") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (
        (event.key !== "Backspace" && event.key !== "Delete") ||
        !selectedRef.current
      ) {
        return;
      }
      event.preventDefault();
      const next = annotationsRef.current.filter(
        (annotation) => annotation.id !== selectedRef.current,
      );
      changeSelection(null);
      commitAnnotations(next);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeSelection, commitAnnotations, mode, redo, undo]);

  const visibleAnnotations = mode === "edit" && draft
    ? [...renderedAnnotations, draft]
    : renderedAnnotations;

  let editorStyle: React.CSSProperties | undefined;
  if (textEditor) {
    const annotation = textEditor.annotation;
    if (annotation.type === "text") {
      editorStyle = {
        left: annotation.x,
        top: annotation.y,
        width: annotation.width,
        minHeight: annotation.fontSize * 1.5,
        fontSize: annotation.fontSize,
        fontFamily: annotation.fontFamily,
        color: annotation.color,
        transform: `rotate(${annotation.rotation ?? 0}deg) scale(${annotation.scaleX ?? 1}, ${annotation.scaleY ?? 1})`,
        transformOrigin: "center center",
      };
    } else if (annotation.type === "callout") {
      editorStyle = {
        left: annotation.x + 8,
        top: annotation.y + 8,
        width: Math.max(80, annotation.width - 16),
        height: Math.max(40, annotation.height - 16),
        fontSize: annotation.fontSize,
        color: annotation.color,
        transform: `rotate(${annotation.rotation ?? 0}deg) scale(${annotation.scaleX ?? 1}, ${annotation.scaleY ?? 1})`,
        transformOrigin: "center center",
      };
    } else {
      const width =
        annotation.type === "rectangle"
          ? annotation.width
          : annotation.radiusX * 2;
      const height =
        annotation.type === "rectangle"
          ? annotation.height
          : annotation.radiusY * 2;
      const x =
        annotation.type === "rectangle"
          ? annotation.x
          : annotation.x - annotation.radiusX;
      const y =
        annotation.type === "rectangle"
          ? annotation.y
          : annotation.y - annotation.radiusY;
      const label = annotation.label ?? makeShapeLabel(color, fontSize);
      editorStyle = {
        left: x + label.padding,
        top: labelY(label.verticalAlign, y, height, label.padding),
        width: Math.max(80, width - label.padding * 2),
        minHeight: label.fontSize * 1.5,
        fontSize: label.fontSize,
        color: label.color,
        textAlign: label.align,
        transform: `rotate(${annotation.rotation ?? 0}deg) scale(${annotation.scaleX ?? 1}, ${annotation.scaleY ?? 1})`,
        transformOrigin: "center center",
      };
    }
  }

  return (
    <div
      ref={wrapperRef}
      id={id}
      className={["dash-konva-annotation-surface", className]
        .filter(Boolean)
        .join(" ")}
      data-mode={mode}
      data-tool={tool}
      style={{
        ...style,
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "transparent",
        display: mode === "hidden" ? "none" : "block",
        pointerEvents: mode === "view" ? "none" : "auto",
        touchAction: mode === "edit" ? "none" : undefined,
        userSelect: mode === "edit" ? "none" : undefined,
        cursor:
          mode !== "edit"
            ? "default"
            : tool === "select"
              ? "default"
              : tool === "text"
                ? "text"
                : tool === "pin"
                  ? "pointer"
                  : tool === "pen" || tool === "highlighter"
                    ? "crosshair"
                    : "copy",
      }}
      onWheel={(event) => {
        if (mode === "edit") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Layer listening={mode === "edit"}>
          {visibleAnnotations.map((annotation) => (
            <AnnotationShape
              key={annotation.id}
              annotation={annotation}
              mode={mode}
              tool={tool}
              selected={mode === "edit" && annotation.id === selectedId}
              onSelect={changeSelection}
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              onEditText={handleEditText}
              onNodeRef={handleNodeRef}
            />
          ))}
          <Transformer
            ref={transformerRef}
            visible={mode === "edit" && tool === "select"}
            rotateEnabled
            flipEnabled={false}
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) =>
              Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8
                ? oldBox
                : newBox
            }
          />
        </Layer>
      </Stage>
      {mode === "edit" && textEditor && (
        <textarea
          autoFocus
          className="dash-konva-annotation-text-editor"
          aria-label={
            textEditor.kind === "label" ? "Shape label" : "Annotation text"
          }
          value={textEditor.value}
          style={editorStyle}
          onChange={(event) =>
            setTextEditor({ ...textEditor, value: event.target.value })
          }
          onBlur={finishTextEdit}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              finishTextEdit();
            } else if (event.key === "Escape") {
              event.preventDefault();
              if (textEditor.kind === "text" && textEditor.isNew) {
                changeSelection(null);
              }
              setTextEditor(null);
            }
          }}
        />
      )}
    </div>
  );
}

AnnotationLayer.defaultProps = defaultProps;

export default AnnotationLayer;
