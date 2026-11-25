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

type AnnotationLayerTool = Literal["select", "pen", "arrow", "rectangle", "ellipse"]
"""Annotation layer interaction tools.

- "select": The selection tool.
- "pen": The freehand drawing tool.
- "arrow": The arrow annotation tool.
- "rectangle": The rectangle annotation tool.
- "ellipse": The ellipse annotation tool.
"""

type AnnotationLayerAnnotationKeys = Literal[
    "id", "type", "x", "y", "width", "height", "points", "color", "strokeWidth"
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
        "selectedId",
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
        selectedId: str | None = None,
        className: str | None = None,
        style: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize an AnnotationLayer component.

        :param id: The unique identifier for the component.
        :type id: str | dict[str, Any] | None
        :param mode: The interaction mode: "view", "edit", or "hidden".
        :type mode: AnnotationLayerMode
        :param tool: The active interaction tool: "select", "pen", "arrow",
            "rectangle", or "ellipse".
        :type tool: AnnotationLayerTool
        :param annotations: JSON-serializable annotation dictionaries to render.
        :type annotations: list[dict[str, Any]] | None
        :param color: The default color for annotations.
        :type color: str
        :param strokeWidth: The default stroke width for annotations.
        :type strokeWidth: int | float
        :param selectedId: The ID of the selected annotation, or None.
        :type selectedId: str | None
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
            "selectedId": selectedId,
            "className": className,
            "style": style,
            **kwargs,
        }
        super().__init__(**props)
