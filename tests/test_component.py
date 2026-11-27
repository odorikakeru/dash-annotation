import json

from dash_konva_annotation import AnnotationLayer


def test_annotation_layer_defaults_are_serializable():
    component = AnnotationLayer(id="annotations")

    assert component.to_plotly_json()["props"] == {
        "id": "annotations",
        "mode": "view",
        "tool": "select",
        "annotations": [],
        "color": "#e03131",
        "strokeWidth": 3,
        "fontSize": 18,
        "selectedId": None,
        "history": "local",
        "undoRequest": 0,
        "redoRequest": 0,
        "clearHistoryRequest": 0,
        "canUndo": False,
        "canRedo": False,
        "persistence": None,
        "persisted_props": ["annotations"],
        "persistence_type": "local",
        "className": None,
        "style": None,
    }
    json.dumps(component.to_plotly_json())


def test_annotation_layer_accepts_json_annotation_data():
    annotations = [
        {
            "id": "rectangle-1",
            "type": "rectangle",
            "x": 12,
            "y": 18,
            "width": 60,
            "height": 30,
            "color": "#e03131",
            "strokeWidth": 3,
        }
    ]

    component = AnnotationLayer(id="annotations", annotations=annotations)

    assert component.annotations == annotations


def test_annotation_layer_accepts_new_annotation_types():
    annotations = [
        {
            "id": "text-1",
            "type": "text",
            "x": 10,
            "y": 20,
            "width": 180,
            "text": "Review this",
            "color": "#111111",
            "strokeWidth": 1,
            "fontSize": 18,
            "fontFamily": "Arial",
            "align": "left",
        },
        {
            "id": "pin-1",
            "type": "pin",
            "x": 100,
            "y": 80,
            "number": 1,
            "radius": 16,
            "color": "#e03131",
            "strokeWidth": 3,
        },
        {
            "id": "callout-1",
            "type": "callout",
            "x": 120,
            "y": 90,
            "width": 180,
            "height": 70,
            "anchorX": 80,
            "anchorY": 60,
            "text": "Investigate",
            "fillColor": "#ffffff",
            "fontSize": 16,
            "color": "#e03131",
            "strokeWidth": 3,
        },
    ]

    component = AnnotationLayer(
        id="annotations",
        tool="text",
        annotations=annotations,
        fontSize=20,
    )

    assert component.tool == "text"
    assert component.fontSize == 20
    assert component.annotations == annotations
    json.dumps(component.to_plotly_json())


def test_annotation_layer_preserves_transform_data():
    annotation = {
        "id": "rectangle-1",
        "type": "rectangle",
        "x": 10,
        "y": 20,
        "width": 100,
        "height": 50,
        "color": "#e03131",
        "strokeWidth": 3,
        "rotation": 15,
        "scaleX": 1.5,
        "scaleY": 0.75,
    }

    component = AnnotationLayer(id="annotations", annotations=[annotation])

    assert component.annotations == [annotation]
    json.dumps(component.to_plotly_json())


def test_annotation_layer_supports_external_history():
    component = AnnotationLayer(
        id="annotations",
        history="external",
        undoRequest=3,
        redoRequest=2,
        clearHistoryRequest=1,
        canUndo=True,
        canRedo=True,
    )

    assert component.history == "external"
    assert component.undoRequest == 3
    assert component.redoRequest == 2
    assert component.clearHistoryRequest == 1
    assert component.canUndo is True
    assert component.canRedo is True
    json.dumps(component.to_plotly_json())


def test_annotation_layer_preserves_text_resize_mode():
    annotation = {
        "id": "callout-1",
        "type": "callout",
        "x": 10,
        "y": 20,
        "width": 180,
        "height": 80,
        "anchorX": 5,
        "anchorY": 5,
        "text": "Scaled callout",
        "fillColor": "#ffffff",
        "fontSize": 18,
        "color": "#e03131",
        "strokeWidth": 3,
        "textResizeMode": "scale",
        "scaleX": 1.5,
    }

    component = AnnotationLayer(id="annotations", annotations=[annotation])

    assert component.annotations == [annotation]
    json.dumps(component.to_plotly_json())


def test_annotation_layer_accepts_dash_persistence_options():
    component = AnnotationLayer(
        id="annotations",
        persistence="workspace-1",
        persisted_props=["annotations", "selectedId"],
        persistence_type="session",
    )

    assert component.persistence == "workspace-1"
    assert component.persisted_props == ["annotations", "selectedId"]
    assert component.persistence_type == "session"
    json.dumps(component.to_plotly_json())


def test_annotation_layer_supports_memory_persistence():
    component = AnnotationLayer(
        id="annotations",
        persistence=True,
        persisted_props=[],
        persistence_type="memory",
    )

    assert component.persisted_props == []
    assert component.persistence_type == "memory"
