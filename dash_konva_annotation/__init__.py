"""Transparent Konva annotation overlay for Dash."""

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


class AnnotationLayer(Component):
    """Render JSON annotations over a positioned Dash workspace."""

    _children_props = []
    _base_nodes = []
    _namespace = "dash_konva_annotation"
    _type = "AnnotationLayer"
    _prop_names = [
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
    _valid_wildcard_attributes = []
    available_properties = _prop_names
    available_wildcard_properties = []
    def __init__(
        self,
        id=None,
        mode="view",
        tool="select",
        annotations=None,
        color="#e03131",
        strokeWidth=3,
        selectedId=None,
        className=None,
        style=None,
        **kwargs,
    ):
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
