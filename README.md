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
- **View** — Annotations remain visible but the overlay's DOM container uses `pointer-events: none`; clicks, hover, scroll, and graph interactions pass to the workspace. Entering View clears the current selection, and annotations cannot be selected or moved.
- **Hidden** — The overlay uses `display: none`. The annotations remain in Dash state and return when the layer is shown again.

The toolbar offers Select, Pen, Arrow, Line, Highlighter, Rectangle, Ellipse, Text, Pin, and Callout. Color, stroke width, font size, and Clear annotations are also available. Deleting the selected annotation uses Delete or Backspace, except when focus is in an input, textarea, select, or content-editable element.

### What happens during an interaction?

In Edit mode, the layer listens to pointer events on its Konva canvas:

1. Pointer down on empty canvas starts a draft at that position. With Select active, clicking empty canvas instead clears the current selection.
2. Pointer movement updates the draft locally in the browser, coalesced to animation frames. Pen and Highlighter record a series of points; Arrow and Line track their endpoints; Rectangle, Ellipse, and Callout calculate their bounds from the drag. Transient drag movement does not call Dash's `setProps`.
3. Pointer up completes the shape. Tiny or zero-size gestures are ignored. A valid shape is added to `annotations` and becomes selected.
4. With Select active, clicking an existing shape selects it and dragging it moves it. Delete or Backspace removes the selected shape.

The layer does not send every pointer movement to Python. It keeps an in-progress draft in React, then reports committed annotation changes and selection changes to Dash. This keeps drawing responsive while still making completed edits available to Dash callbacks.

Text, Pins, and Callouts use click-oriented interactions:

- **Text** — Click to place a text editor. Enter commits, Shift+Enter inserts a newline, and Escape cancels.
- **Shape labels** — With Select active, double-click a Rectangle or Ellipse to add or edit its label.
- **Pin** — Click to place the lowest available positive number.
- **Callout** — Drag a callout box, then edit its text. Its leader remains anchored at the start of the drag.
- **Callout anchor** — When a callout is selected, drag the blue-and-white anchor handle to move its pointed-to location independently of the bubble.
- **Editing existing text** — Double-click standalone Text or a Callout in Select mode.
- **Resize and rotate** — In Select mode, use the handles around the selected annotation. Transform settings are stored as `scaleX`, `scaleY`, and `rotation`.
- **Text-containing resize** — Callouts, standalone text, and labeled shapes reflow at a fixed font size when resized. Resizing changes their text area rather than stretching letters. Callouts grow vertically when text would otherwise be clipped.
- **Edit color or font size** — Select an annotation, then change the demo's Color or Font size control. Text size changes apply to text, callouts, and existing shape labels.
- **Undo and redo** — Use Ctrl/Cmd+Z to undo, and Ctrl/Cmd+Shift+Z or Ctrl+Y to redo. History is kept for edits made during the current browser session.
- **Dash history controls** — Apps can increment `undoRequest`, `redoRequest`, or `clearHistoryRequest` from ordinary callbacks. `canUndo` and `canRedo` expose whether the commands are currently available.
- **History ownership** — `history="local"` keeps browser-side snapshots. Use `history="external"` when Dash owns restoration, or `history="disabled"` when history is not available.

## Props and callbacks

`AnnotationLayer` behaves like other Dash components: its properties are the interface between the layer and your Dash application. A callback can set properties to configure it, and can read properties that the user changed.

| Property | Direction | Meaning |
| --- | --- | --- |
| `mode` | App → layer | `edit`, `view`, or `hidden` |
| `tool` | App → layer | `select`, `pen`, `arrow`, `line`, `highlighter`, `rectangle`, `ellipse`, `text`, `pin`, or `callout` |
| `color` | App → layer | Color used for newly created shapes |
| `strokeWidth` | App → layer | Stroke width used for newly created shapes |
| `fontSize` | App → layer | Font size for new Text, labels, and Callouts |
| `annotations` | Both ways | Current JSON-serializable list of annotations |
| `selectedId` | Both ways | ID of the selected annotation, or `None` |
| `history` | App → layer | `local`, `external`, or `disabled` |
| `undoRequest` | App → layer | Increment to perform one local undo |
| `redoRequest` | App → layer | Increment to perform one local redo |
| `clearHistoryRequest` | App → layer | Increment to clear local history without changing annotations |
| `canUndo` | Layer → app | Whether a local undo is available |
| `canRedo` | Layer → app | Whether a local redo is available |
| `persistence` | App → layer | Truthy to enable Dash persistence; changing the truthy value clears the previous persistence key |
| `persisted_props` | App → layer | Properties eligible for persistence; defaults to `["annotations"]` |
| `persistence_type` | App → layer | `local` (default), `session`, or `memory` browser storage |

When a user finishes drawing, moves a shape, selects or deselects a shape, or deletes one, the React component calls Dash's `setProps` to update the relevant properties. Dash can then use those property changes as callback inputs. Conversely, a callback can update a property—for example, the demo's Clear button sends an empty annotation list back to the component.

### Persisting annotations

Enable Dash's built-in persistence with a component ID and `persistence=True`:

```python
AnnotationLayer(
    id="annotation-layer",
    persistence=True,
    persistence_type="local",
)
```

`persisted_props` defaults to `["annotations"]`, so completed annotations are
restored from browser storage without a callback or a separate `dcc.Store`.
Use `persistence_type="local"` for storage that survives browser restarts,
`"session"` for the current browser-tab session, or `"memory"` for storage that
lasts while the Dash page remains loaded.

Persist additional user-editable properties by naming them explicitly:

```python
AnnotationLayer(
    id="annotation-layer",
    persistence="review-workspace-v1",
    persisted_props=["annotations", "selectedId"],
)
```

Changing the truthy `persistence` value creates a new storage key, which is
useful when a new layout or annotation schema should ignore values saved by an
older version. Persistence is scoped to the component ID, so a stable,
app-unique ID is required.

Only completed edits are published and persisted. Draft pointer movement,
in-progress drags, transform previews, callout-anchor previews, and uncommitted
text remain local React/Konva state. Navigation away from the page does not
flush these unfinished interactions; normal commit, blur, Enter, drag-end, and
transform-end behavior is unchanged.

The demo wires its toolbar controls to layer properties with callbacks:

| Input | Output | Effect |
| --- | --- | --- |
| Mode control value | `annotation-layer.mode` | Switches between Edit, View, and Hidden |
| Tool control value | `annotation-layer.tool` | Chooses the active annotation tool |
| Color input value | `annotation-layer.color` | Sets the color for new annotations |
| Stroke slider value | `annotation-layer.strokeWidth` | Sets the stroke width for new annotations |
| Font size slider value | `annotation-layer.fontSize` | Sets the font size for text annotations |
| Clear button clicks | `annotation-layer.annotations` | Replaces the annotation list with an empty list |
| `annotation-layer.annotations` | JSON display | Pretty-prints the current annotation list |

The annotations display callback reads the component's property and renders it as formatted JSON:

```python
@callback(
    Output("annotation-json", "children"),
    Input("annotation-layer", "annotations"),
)
def show_annotations(annotations):
    return json.dumps(annotations or [], indent=2)
```

To respond to selection in your own app, use `selectedId` as a callback input in the same way:

```python
@callback(
    Output("selection-message", "children"),
    Input("annotation-layer", "selectedId"),
)
def show_selected_annotation(selected_id):
    return f"Selected annotation: {selected_id or 'None'}"
```

The demo displays the annotations list but does not currently display the selected ID. Its other callbacks, for the live counter and selected subsystem, are ordinary workspace callbacks and are independent of the annotation layer.

## Annotation JSON

Coordinates are pixel offsets within the annotated region. Every annotation has `id`, `type`, `color`, and `strokeWidth`. The remaining fields are:

```json
{"id":"pen-uuid","type":"pen","color":"#e03131","strokeWidth":3,"points":[12,18,24,30]}
{"id":"arrow-uuid","type":"arrow","color":"#e03131","strokeWidth":3,"points":[12,18,80,60]}
{"id":"line-uuid","type":"line","color":"#e03131","strokeWidth":3,"points":[12,18,80,60]}
{"id":"highlighter-uuid","type":"highlighter","color":"#ffd43b","strokeWidth":3,"opacity":0.35,"points":[12,18,24,30]}
{"id":"rectangle-uuid","type":"rectangle","color":"#e03131","strokeWidth":3,"x":12,"y":18,"width":80,"height":42}
{"id":"ellipse-uuid","type":"ellipse","color":"#e03131","strokeWidth":3,"x":52,"y":39,"radiusX":40,"radiusY":21}
{"id":"text-uuid","type":"text","color":"#e03131","strokeWidth":3,"x":12,"y":18,"width":180,"text":"Review this","fontSize":18,"fontFamily":"Arial","align":"left"}
{"id":"pin-uuid","type":"pin","color":"#e03131","strokeWidth":3,"x":52,"y":39,"number":1,"radius":16}
{"id":"callout-uuid","type":"callout","color":"#e03131","strokeWidth":3,"x":120,"y":90,"width":180,"height":70,"anchorX":60,"anchorY":55,"text":"Investigate","fillColor":"#ffffff","fontSize":18}
```

Text-bearing annotations default to `textResizeMode: "reflow"`. Advanced
Python developers can explicitly set `textResizeMode: "scale"` in annotation
JSON to retain scale-based distortion. The demo and normal UI intentionally
do not expose this experimental backend option.

Rectangles and ellipses can additionally contain an optional `label`:

```json
{"text":"Peak response","color":"#111111","fontSize":16,"align":"center","verticalAlign":"middle","padding":8}
```

The annotation list contains JSON-serializable values, so it can be displayed, stored, or processed by ordinary Dash callbacks. The demo's JSON panel is one example of reading that property.

The history buttons use ordinary Dash counters:

```python
@callback(
    Output("annotation-layer", "undoRequest"),
    Input("undo-button", "n_clicks"),
    prevent_initial_call=True,
)
def request_undo(clicks: int) -> int:
    return clicks
```

Use capability state to control the buttons:

```python
@callback(
    Output("undo-button", "disabled"),
    Input("annotation-layer", "canUndo"),
)
def disable_undo(can_undo: bool | None) -> bool:
    return not bool(can_undo)
```

In `external` mode, React emits annotation updates but retains no history and
ignores local history commands. Dash code must distinguish its own snapshot
restoration from user edits so an undo operation is not appended as a new
history entry. `disabled` mode behaves the same at the component boundary, but
communicates that undo/redo is intentionally unavailable.

## Manual browser checklist

1. In Edit/Pen, draw across the DMC card and Plotly graph; they should stay visible underneath, and their controls should not respond.
2. Select Edit/Line, Highlighter, Rectangle, Arrow, or Ellipse and draw; then use Select to drag an annotation and Delete to remove it. Confirm the JSON display changes.
3. Select an annotation, switch to View, and confirm its selection highlight disappears. Confirm annotations remain visible while the button, DMC controls, scrolling, and Plotly interactions work through them.
4. In Hidden, confirm drawings disappear and workspace controls remain interactive; switch back to Edit and confirm drawings return.
5. Expand/collapse the workspace accordion and resize the browser; the overlay should continue covering the workspace.
6. Create and edit standalone Text, double-click a rectangle to add a label, create a Callout, and place multiple Pins. Confirm deletion and numbering behavior in JSON.
7. Select an annotation, resize and rotate it with the handles, change its color/font size, then undo and redo the edits.
8. Use the demo Undo/Redo/Clear history buttons and change the history mode. External and disabled modes should leave history controls unavailable.
9. Select a callout, move its bubble, and move its anchor handle independently. Confirm the pointed-to coordinate stays fixed during bubble movement.
10. Enable `persistence=True`, create or move annotations, and reload the page. Confirm the completed annotations are restored. Repeat with `persistence_type="session"` and a new browser session to confirm session storage is cleared, and with `"memory"` to confirm a reload clears it.

## Known limitations

- Coordinates are pixel-relative to the overlay container; major responsive reflow may misalign existing drawings.
- There is no DOM-element anchoring or automatic repositioning.
- Annotations are not semantically anchored to Plotly data and do not follow Plotly pan/zoom.
- There is no collaboration, image/PDF export, or full-page annotation.
- Selection supports dragging, resizing, rotation, deletion, and basic text/color editing.
- The package targets a defined, positioned workspace; place `AnnotationLayer` inside a parent with `position: relative`.
- Polygon annotations and blur are deferred in issues #4 and #3, respectively.
