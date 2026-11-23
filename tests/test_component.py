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
        "selectedId": None,
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
