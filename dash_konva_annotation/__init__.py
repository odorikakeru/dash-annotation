"""Transparent Konva annotation overlay for Dash."""

from typing import Any, Literal

from dash.development.base_component import Component

__version__ = "0.1.0"

_js_dist = [
    {
        "relative_package_path": "dash_konva_annotation.min.js",
        "dev_package_path": "dash_konva_annotation.dev.js",
        "namespace": "dash_konva_annotation",
    }
]
_css_dist = [
    {
        "relative_package_path": "annotation.css",
        "namespace": "dash_konva_annotation",
    }
]


type AnnotationLayerMode = Literal["view", "edit", "hidden"]
"""Annotation layer interaction modes.

- "view": The layer is view-only.
- "edit": The layer is editable.
- "hidden": The layer is hidden.
"""

type AnnotationLayerHistoryMode = Literal["local", "external", "disabled"]
"""Annotation history ownership mode.

- "local": React records edits and supports keyboard and callback-driven history.
- "external": Dash/Python owns history and React records no snapshots.
- "disabled": History is unavailable.
"""

type AnnotationLayerPersistenceType = Literal["local", "session", "memory"]
"""Dash persistence storage backends."""

type AnnotationLayerTool = Literal[
    "select",
    "pen",
    "arrow",
    "line",
    "highlighter",
    "rectangle",
    "ellipse",
    "text",
    "pin",
    "callout",
]
"""Annotation layer interaction tools.

- "select": The selection tool.
- "pen": The freehand drawing tool.
- "arrow": The arrow annotation tool.
- "line": The straight-line annotation tool.
- "highlighter": The translucent, wide-stroke highlighting tool.
- "rectangle": The rectangle annotation tool.
- "ellipse": The ellipse annotation tool.
- "text": The standalone text tool.
- "pin": The automatically numbered pin tool.
- "callout": The anchored text callout tool.
"""

type AnnotationLayerAnnotationKeys = Literal[
    "id",
    "type",
    "x",
    "y",
    "width",
    "height",
    "points",
    "color",
    "strokeWidth",
    "opacity",
    "fontSize",
    "fontFamily",
    "align",
    "text",
    "label",
    "radius",
    "radiusX",
    "radiusY",
    "number",
    "anchorX",
    "anchorY",
    "fillColor",
    "rotation",
    "scaleX",
    "scaleY",
    "textResizeMode",
]
"""Annotation layer annotation dictionary keys."""

type AnnotationLayerAnnotation = dict[AnnotationLayerAnnotationKeys, Any]
"""Annotation layer annotation dictionary."""


class AnnotationLayer(Component):
    """Render JSON annotations over a positioned Dash workspace."""

    _children_props: list[str] = []  # noqa: RUF012
    _base_nodes: list[str] = []  # noqa: RUF012
    _namespace = "dash_konva_annotation"
    _type = "AnnotationLayer"
    _prop_names: list[str] = [  # noqa: RUF012
        "id",
        "mode",
        "tool",
        "annotations",
        "color",
        "strokeWidth",
        "fontSize",
        "selectedId",
        "history",
        "undoRequest",
        "redoRequest",
        "clearHistoryRequest",
        "canUndo",
        "canRedo",
        "persistence",
        "persisted_props",
        "persistence_type",
        "className",
        "style",
    ]
    _valid_wildcard_attributes: list[str] = []  # noqa: RUF012
    available_properties: list[str] = _prop_names
    available_wildcard_properties: list[str] = []  # noqa: RUF012

    def __init__(
        self,
        id: str | dict[str, Any] | None = None,
        mode: AnnotationLayerMode = "view",
        tool: AnnotationLayerTool = "select",
        annotations: list[dict[str, Any]] | None = None,
        color: str = "#e03131",
        strokeWidth: float = 3,
        fontSize: float = 18,
        selectedId: str | None = None,
        history: AnnotationLayerHistoryMode = "local",
        undoRequest: int = 0,
        redoRequest: int = 0,
        clearHistoryRequest: int = 0,
        canUndo: bool = False,
        canRedo: bool = False,
        persistence: bool | str | float | None = None,
        persisted_props: list[str] | None = None,
        persistence_type: AnnotationLayerPersistenceType = "local",
        className: str | None = None,
        style: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize an AnnotationLayer component.

        :param id: The unique identifier for the component.
        :type id: str | dict[str, Any] | None
        :param mode: The interaction mode: "view", "edit", or "hidden".
        :type mode: AnnotationLayerMode
        :param tool: The active interaction tool.
        :type tool: AnnotationLayerTool
        :param annotations: JSON-serializable annotation dictionaries to render.
        :type annotations: list[dict[str, Any]] | None
        :param color: The default color for annotations.
        :type color: str
        :param strokeWidth: The default stroke width for annotations.
        :type strokeWidth: int | float
        :param fontSize: The default text font size in pixels.
        :type fontSize: int | float
        :param selectedId: The ID of the selected annotation, or None.
        :type selectedId: str | None
        :param history: History ownership mode: "local", "external", or
            "disabled".
        :type history: AnnotationLayerHistoryMode
        :param undoRequest: Increment to request one local undo operation.
        :type undoRequest: int
        :param redoRequest: Increment to request one local redo operation.
        :type redoRequest: int
        :param clearHistoryRequest: Increment to clear local undo/redo history.
        :type clearHistoryRequest: int
        :param canUndo: Whether local history currently supports undo.
        :type canUndo: bool
        :param canRedo: Whether local history currently supports redo.
        :type canRedo: bool
        :param persistence: Enable Dash persistence with a truthy value. Changing
            to a different truthy value clears the previous persisted state.
        :type persistence: bool | str | float | None
        :param persisted_props: Component properties Dash may persist. Defaults
            to ``["annotations"]``.
        :type persisted_props: list[str] | None
        :param persistence_type: Browser storage backend: "local", "session", or
            "memory".
        :type persistence_type: AnnotationLayerPersistenceType
        :param className: The CSS class name for the component.
        :type className: str | None
        :param style: The inline style for the component.
        :type style: dict[str, Any] | None
        :param kwargs: Additional Dash component properties.
        :type kwargs: Any
        """
        props = {
            "id": id,
            "mode": mode,
            "tool": tool,
            "annotations": [] if annotations is None else annotations,
            "color": color,
            "strokeWidth": strokeWidth,
            "fontSize": fontSize,
            "selectedId": selectedId,
            "history": history,
            "undoRequest": undoRequest,
            "redoRequest": redoRequest,
            "clearHistoryRequest": clearHistoryRequest,
            "canUndo": canUndo,
            "canRedo": canRedo,
            "persistence": persistence,
            "persisted_props": (
                ["annotations"] if persisted_props is None else persisted_props
            ),
            "persistence_type": persistence_type,
            "className": className,
            "style": style,
            **kwargs,
        }
        super().__init__(**props)
