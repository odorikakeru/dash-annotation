import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Ellipse,
  Layer,
  Line,
  Rect,
  Stage,
} from "react-konva";
import type Konva from "konva";
import type {
  Annotation,
  AnnotationLayerProps,
  AnnotationMode,
  AnnotationTool,
  ArrowAnnotation,
  EllipseAnnotation,
  PenAnnotation,
  RectangleAnnotation,
} from "../annotationTypes";
import defaultProps from "../defaultProps";

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  tool: Exclude<AnnotationTool, "select">;
  annotation: Annotation;
}

interface ShapeProps {
  annotation: Annotation;
  mode: AnnotationMode;
  tool: AnnotationTool;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (annotation: Annotation, node: Konva.Node) => void;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `annotation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeAnnotation(
  tool: Exclude<AnnotationTool, "select">,
  x: number,
  y: number,
  color: string,
  strokeWidth: number,
): Annotation {
  const base = { id: makeId(), color, strokeWidth };
  switch (tool) {
    case "pen":
      return { ...base, type: "pen", points: [x, y, x, y] };
    case "arrow":
      return { ...base, type: "arrow", points: [x, y, x, y] };
    case "rectangle":
      return { ...base, type: "rectangle", x, y, width: 0, height: 0 };
    case "ellipse":
      return { ...base, type: "ellipse", x, y, radiusX: 0, radiusY: 0 };
  }
}

function updateDraft(gesture: Gesture, x: number, y: number): Annotation {
  const { annotation } = gesture;
  if (annotation.type === "pen") {
    return { ...annotation, points: [...annotation.points, x, y] };
  }
  if (annotation.type === "arrow") {
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
  return {
    ...annotation,
    x: (gesture.startX + x) / 2,
    y: (gesture.startY + y) / 2,
    radiusX: Math.abs(x - gesture.startX) / 2,
    radiusY: Math.abs(y - gesture.startY) / 2,
  };
}

function AnnotationShape({
  annotation,
  mode,
  tool,
  selected,
  onSelect,
  onDragEnd,
}: ShapeProps): React.ReactElement {
  const common = {
    stroke: annotation.color,
    strokeWidth: annotation.strokeWidth,
    draggable: mode === "edit" && tool === "select",
    listening: mode === "edit" && tool === "select",
    onClick: () => onSelect(annotation.id),
    onTap: () => onSelect(annotation.id),
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
      onDragEnd(annotation, event.target),
    shadowColor: selected ? "#228be6" : undefined,
    shadowBlur: selected ? 5 : 0,
  };

  switch (annotation.type) {
    case "pen":
      return (
        <Line
          {...common}
          points={annotation.points}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={Math.max(annotation.strokeWidth, 10)}
        />
      );
    case "arrow":
      return (
        <Arrow
          {...common}
          points={annotation.points}
          pointerLength={Math.max(8, annotation.strokeWidth * 3)}
          pointerWidth={Math.max(8, annotation.strokeWidth * 3)}
          hitStrokeWidth={Math.max(annotation.strokeWidth, 10)}
        />
      );
    case "rectangle":
      return (
        <Rect
          {...common}
          x={annotation.x}
          y={annotation.y}
          width={annotation.width}
          height={annotation.height}
          fill="rgba(0, 0, 0, 0.001)"
        />
      );
    case "ellipse":
      return (
        <Ellipse
          {...common}
          x={annotation.x}
          y={annotation.y}
          radiusX={annotation.radiusX}
          radiusY={annotation.radiusY}
          fill="rgba(0, 0, 0, 0.001)"
        />
      );
  }
}

function movedAnnotation(annotation: Annotation, node: Konva.Node): Annotation {
  const { x, y } = node.position();
  if (annotation.type === "pen" || annotation.type === "arrow") {
    node.position({ x: 0, y: 0 });
    const points = annotation.points.map((value, index) => value + (index % 2 ? y : x));
    return { ...annotation, points } as PenAnnotation | ArrowAnnotation;
  }
  return { ...annotation, x, y } as RectangleAnnotation | EllipseAnnotation;
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
  selectedId: selectedIdProp = defaultProps.selectedId,
  className,
  style,
  setProps,
}: AnnotationLayerProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const annotationsRef = useRef<Annotation[]>(annotations);
  const selectedRef = useRef<string | null>(selectedIdProp ?? null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<Annotation | null>(null);
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

  useEffect(() => {
    annotationsRef.current = annotations;
    setOptimisticAnnotations(null);
  }, [annotationsSignature]);

  useEffect(() => {
    selectedRef.current = selectedIdProp ?? null;
    setSelectedId(selectedIdProp ?? null);
  }, [selectedIdProp]);

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

  const commitAnnotations = useCallback(
    (next: Annotation[]) => {
      annotationsRef.current = next;
      setOptimisticAnnotations(next);
      setProps?.({ annotations: next });
    },
    [setProps],
  );

  const changeSelection = useCallback(
    (nextId: string | null) => {
      if (selectedRef.current === nextId) return;
      selectedRef.current = nextId;
      setSelectedId(nextId);
      setProps?.({ selectedId: nextId });
    },
    [setProps],
  );

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

      const annotation = makeAnnotation(tool, point.x, point.y, color, strokeWidth);
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
    [changeSelection, color, mode, strokeWidth, tool],
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

      if (
        (completed.type === "pen" && completed.points.length < 4) ||
        (completed.type === "arrow" &&
          completed.points[0] === completed.points[2] &&
          completed.points[1] === completed.points[3]) ||
        (completed.type === "rectangle" &&
          (completed.width < 1 || completed.height < 1)) ||
        (completed.type === "ellipse" &&
          (completed.radiusX < 1 || completed.radiusY < 1))
      ) {
        return;
      }
      changeSelection(completed.id);
      commitAnnotations([...annotationsRef.current, completed]);
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
      const next = annotationsRef.current.map((item) =>
        item.id === annotation.id ? movedAnnotation(item, node) : item,
      );
      commitAnnotations(next);
    },
    [commitAnnotations],
  );

  useEffect(() => {
    if (mode !== "edit") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key !== "Backspace" && event.key !== "Delete") ||
        isEditableTarget(event.target) ||
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
  }, [changeSelection, commitAnnotations, mode]);

  const visibleAnnotations = draft
    ? [...renderedAnnotations, draft]
    : renderedAnnotations;

  return (
    <div
      ref={wrapperRef}
      id={id}
      className={["dash-konva-annotation-surface", className]
        .filter(Boolean)
        .join(" ")}
      data-mode={mode}
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
              : tool === "pen"
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
              selected={annotation.id === selectedId}
              onSelect={changeSelection}
              onDragEnd={handleDragEnd}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

AnnotationLayer.defaultProps = defaultProps;

export default AnnotationLayer;
