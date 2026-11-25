"""Live Dash/DMC/Plotly workspace for the annotation overlay prototype."""

import json
import os
from typing import Any

import dash
import dash_mantine_components as dmc  # type: ignore
import plotly.graph_objects as go  # type: ignore
from dash import Input, Output, callback, dcc, html

from dash_konva_annotation import (
    AnnotationLayer,
    AnnotationLayerAnnotation,
    AnnotationLayerMode,
    AnnotationLayerTool,
)

os.environ.setdefault("REACT_VERSION", "19.2.4")


def build_figure() -> go.Figure:
    """Build and return the initial Plotly figure."""
    figure = go.Figure(
        data=[
            go.Scatter(
                x=[1, 2, 3, 4, 5, 6],
                y=[3, 5, 4, 8, 6, 9],
                mode="lines+markers",
                line={"color": "#228be6", "width": 3},
                marker={"size": 9},
                name="Measured response",
            )
        ]
    )
    figure.update_layout(
        title="Live Plotly response chart",
        margin={"l": 35, "r": 20, "t": 55, "b": 35},
        paper_bgcolor="rgba(255,255,255,0)",
        plot_bgcolor="rgba(255,255,255,0)",
        dragmode="zoom",
    )
    return figure


app = dash.Dash(__name__, title="Dash Konva Annotation MVP")

app.layout = dmc.MantineProvider(
    html.Div(
        [
            dmc.Title("Dash Konva Annotation MVP", order=2, mb="md"),
            dmc.Text(
                "Controls stay outside the workspace; try Edit, View, and Hidden "
                "while interacting with the live content below.",
                c="dimmed",
                mb="lg",
            ),
            dmc.Card(
                [
                    dmc.Group(
                        [
                            dmc.SegmentedControl(
                                id="mode-control",
                                value="edit",
                                data=[
                                    {"label": "Edit", "value": "edit"},
                                    {"label": "View", "value": "view"},
                                    {"label": "Hidden", "value": "hidden"},
                                ],
                            ),
                            dmc.SegmentedControl(
                                id="tool-control",
                                value="pen",
                                data=[
                                    {"label": "Select", "value": "select"},
                                    {"label": "Pen", "value": "pen"},
                                    {"label": "Arrow", "value": "arrow"},
                                    {"label": "Rectangle", "value": "rectangle"},
                                    {"label": "Ellipse", "value": "ellipse"},
                                ],
                            ),
                            dmc.ColorInput(
                                id="color-control",
                                label="Color",
                                value="#e03131",
                                w=160,
                            ),
                            dmc.Stack(
                                [
                                    dmc.Text("Stroke width", size="sm"),
                                    dmc.Slider(
                                        id="stroke-control",
                                        min=1,
                                        max=12,
                                        step=1,
                                        value=3,
                                        w=180,
                                    ),
                                ],
                                gap=2,
                            ),
                            dmc.Button(
                                "Clear annotations",
                                id="clear-button",
                                color="red",
                                variant="light",
                            ),
                        ],
                        align="end",
                        wrap="wrap",
                        gap="md",
                    ),
                ],
                withBorder=True,
                mb="md",
            ),
            html.Div(
                [
                    html.Div(
                        dmc.Grid(
                            [
                                dmc.GridCol(
                                    dmc.Card(
                                        [
                                            dmc.Group(
                                                [
                                                    dmc.Title(
                                                        "Workspace status", order=4
                                                    ),
                                                    dmc.Badge(
                                                        "LIVE", color="green"
                                                    ),
                                                ],
                                                justify="space-between",
                                                mb="sm",
                                            ),
                                            dmc.Text(
                                                "System: ADAMS-04",
                                                id="system-label",
                                                mb=4,
                                            ),
                                            dmc.Text(
                                                "Operator: Demonstration User",
                                                mb=4,
                                            ),
                                            dmc.Text(
                                                "Last update: just now",
                                                c="dimmed",
                                                mb="md",
                                            ),
                                            dmc.Button(
                                                "Increment live counter",
                                                id="counter-button",
                                            ),
                                            dmc.Text(
                                                "Button clicks: 0",
                                                id="counter-label",
                                                mt="sm",
                                            ),
                                        ],
                                        withBorder=True,
                                        shadow="sm",
                                        radius="md",
                                    ),
                                    span={"base": 12, "md": 5},
                                ),
                                dmc.GridCol(
                                    dmc.Card(
                                        dcc.Graph(
                                            id="response-graph",
                                            figure=build_figure(),
                                            config={"displayModeBar": True},
                                            style={"height": 330},
                                        ),
                                        withBorder=True,
                                        shadow="sm",
                                        radius="md",
                                        p="sm",
                                    ),
                                    span={"base": 12, "md": 7},
                                ),
                                dmc.GridCol(
                                    dmc.Card(
                                        [
                                            dmc.Title(
                                                "Interactive controls", order=4, mb="sm"
                                            ),
                                            dmc.Select(
                                                id="workspace-select",
                                                label="Active subsystem",
                                                value="cooling",
                                                data=[
                                                    {
                                                        "value": "cooling",
                                                        "label": "Cooling loop",
                                                    },
                                                    {
                                                        "value": "power",
                                                        "label": "Power unit",
                                                    },
                                                    {
                                                        "value": "sensors",
                                                        "label": "Sensor array",
                                                    },
                                                ],
                                                mb="md",
                                            ),
                                            dmc.Switch(
                                                id="monitor-switch",
                                                label="Live monitoring",
                                                checked=True,
                                                mb="md",
                                            ),
                                            dmc.Accordion(
                                                [
                                                    dmc.AccordionItem(
                                                        [
                                                            dmc.AccordionControl(
                                                                "Additional system details"
                                                            ),
                                                            dmc.AccordionPanel(
                                                                "This panel changes the "
                                                                "workspace layout and "
                                                                "exercises ResizeObserver."
                                                            ),
                                                        ],
                                                        value="details",
                                                    )
                                                ],
                                                value=None,
                                            ),
                                            dmc.Text(
                                                "Selected subsystem: Cooling loop",
                                                id="selection-label",
                                                mt="sm",
                                                c="dimmed",
                                            ),
                                        ],
                                        withBorder=True,
                                        shadow="sm",
                                        radius="md",
                                    ),
                                    span=12,
                                ),
                            ],
                            gap="md",
                        ),
                        className="demo-workspace",
                    ),
                    AnnotationLayer(
                        id="annotation-layer",
                        mode="edit",
                        tool="pen",
                        annotations=[],
                        color="#e03131",
                        strokeWidth=3,
                        selectedId=None,
                    ),
                ],
                className="annotatable-region",
            ),
            dmc.Title("Annotation JSON", order=4, mt="lg", mb="xs"),
            html.Pre(
                "[]",
                id="annotation-json",
                className="annotation-json",
            ),
        ],
        style={"maxWidth": 1440, "margin": "0 auto", "padding": 24},
    )
)


@callback(
    Output("annotation-layer", "mode"),
    Input("mode-control", "value"),
)
def update_mode(mode: AnnotationLayerMode) -> AnnotationLayerMode:
    return mode


@callback(
    Output("annotation-layer", "tool"),
    Input("tool-control", "value"),
)
def update_tool(tool: AnnotationLayerTool) -> AnnotationLayerTool:
    return tool


@callback(
    Output("annotation-layer", "color"),
    Input("color-control", "value"),
)
def update_color(color: str) -> str:
    return color


@callback(
    Output("annotation-layer", "strokeWidth"),
    Input("stroke-control", "value"),
)
def update_stroke_width(width: float) -> float:
    return width


@callback(
    Output("annotation-layer", "annotations"),
    Input("clear-button", "n_clicks"),
    prevent_initial_call=True,
)
def clear_annotations(_clicks) -> list[dict[str, Any]]:
    return []


@callback(
    Output("annotation-json", "children"),
    Input("annotation-layer", "annotations"),
)
def show_annotations(annotations: list[AnnotationLayerAnnotation] | None) -> str:
    return json.dumps(annotations or [], indent=2)


@callback(
    Output("counter-label", "children"),
    Input("counter-button", "n_clicks"),
)
def show_counter(clicks: int | None) -> str:
    return f"Button clicks: {clicks or 0}"


@callback(
    Output("selection-label", "children"),
    Input("workspace-select", "value"),
)
def show_selection(value: str | None) -> str:
    return f"Selected subsystem: {value.title() if value else 'None'}"


if __name__ == "__main__":
    app.run(debug=True)
