# Dash Konva Annotation MVP

An experimental, transparent Konva annotation layer for one defined region of a live Dash application. The underlying Dash, DMC, HTML, and Plotly content remains real and visible; the overlay changes whether it captures pointer input.

## Environment and compatibility

Dash 4.5.1 defaults to React 18.3.1. Dash 4.5.1 also supports React 19.2.4 when `REACT_VERSION=19.2.4` is set before Dash is imported. This project targets that React 19 build, matching DMC 3.0.0 (Mantine 9.7.4), and uses `react-konva` 19.2.2, whose peer range includes React 19.2.

The checked dependency versions are Python 3.12.3 (the available environment; Python 3.13 is supported), Dash 4.5.1, React/ReactDOM 19.2.4, Konva 10.0.12, `react-konva` 19.2.2, `dash-mantine-components` 3.0.0, Mantine 9.7.4, Node.js 26.12.1, and npm 11.20.0. `package-lock.json` records the resolved Node dependencies.

## Installation and build

Use Python 3.13 and Node.js/npm:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[demo,test]"
npm ci
npm run build
```

The build produces matching development and production React-Konva/Konva bundles, selected by Dash to match its React renderer mode. Both use Dash's global React and ReactDOM instances. Rebuild after changing files under `src/`. The component can be installed into another environment from this repository with `python -m pip install .`; its Dash dependency is declared in `pyproject.toml`.

## Run the demo

From the repository root, run:

```bash
python demo/app.py
```

Open the local URL printed by Dash. The demo sets `REACT_VERSION=19.2.4` before importing Dash. Its controls are outside the annotated region, while a live button, DMC cards/controls, an accordion, and a Plotly chart are underneath the overlay. The button, DMC controls, graph, and expandable panel let you check input pass-through and `ResizeObserver` behavior.

## Interaction modes

- **Edit** — Annotations are visible and interactive. The overlay captures pointer input, so the live workspace is visible but cannot be operated. Choose a drawing tool to create an annotation or Select to drag/delete one.
- **View** — Annotations remain visible but the overlay's DOM container uses `pointer-events: none`; clicks, hover, scroll, and graph interactions pass to the workspace. Annotations cannot be selected or moved.
- **Hidden** — The overlay uses `display: none`. The annotations remain in Dash state and return when the layer is shown again.

The toolbar offers Select, Pen, Arrow, Rectangle, and Ellipse; color, stroke width, and Clear annotations are also available. Deleting the selected annotation uses Delete or Backspace, except when focus is in an input, textarea, select, or content-editable element.

## Annotation JSON

Coordinates are pixel offsets within the annotated region. Every annotation has `id`, `type`, `color`, and `strokeWidth`. The remaining fields are:

```json
{"id":"pen-uuid","type":"pen","color":"#e03131","strokeWidth":3,"points":[12,18,24,30]}
{"id":"arrow-uuid","type":"arrow","color":"#e03131","strokeWidth":3,"points":[12,18,80,60]}
{"id":"rectangle-uuid","type":"rectangle","color":"#e03131","strokeWidth":3,"x":12,"y":18,"width":80,"height":42}
{"id":"ellipse-uuid","type":"ellipse","color":"#e03131","strokeWidth":3,"x":52,"y":39,"radiusX":40,"radiusY":21}
```

Committed edits are passed to Dash through `setProps` as JSON-serializable values; freehand pointer movement stays local to React until the stroke completes. The demo displays the component's annotations property as JSON.

## Manual browser checklist

1. In Edit/Pen, draw across the DMC card and Plotly graph; they should stay visible underneath, and their controls should not respond.
2. Select Edit/Rectangle, Arrow, or Ellipse and draw; then use Select to drag an annotation and Delete to remove it. Confirm the JSON display changes.
3. In View, confirm annotations remain visible while the button, DMC controls, scrolling, and Plotly interactions work through them.
4. In Hidden, confirm drawings disappear and workspace controls remain interactive; switch back to Edit and confirm drawings return.
5. Expand/collapse the workspace accordion and resize the browser; the overlay should continue covering the workspace.

## Known limitations

- Coordinates are pixel-relative to the overlay container; major responsive reflow may misalign existing drawings.
- There is no DOM-element anchoring or automatic repositioning.
- Annotations are not semantically anchored to Plotly data and do not follow Plotly pan/zoom.
- There is no persistence, collaboration, image/PDF export, text annotation, or full-page annotation.
- Selection supports dragging and deletion, but not resize handles or sophisticated editing.
- The package targets a defined, positioned workspace; place `AnnotationLayer` inside a parent with `position: relative`.
