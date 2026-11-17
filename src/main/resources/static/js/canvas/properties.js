// Properties editor for the currently selected canvas object.

import {
    elements,
    state,
    clamp,
    getObjectById,
    isGeometricObject,
    config
} from "./context.js";

export function createProperties(actions) {
    function createEditorField(labelText, control) {
        const wrapper = document.createElement("label");
        wrapper.className = "editor-field";

        const label = document.createElement("span");
        label.className = "editor-field-label";
        label.textContent = labelText;

        wrapper.appendChild(label);
        wrapper.appendChild(control);
        elements.selectedObjectFields.appendChild(wrapper);

        return wrapper;
    }

    function createEditorRange(labelText, value, min, max, onInput, onCommit) {
        const wrapper = document.createElement("div");
        wrapper.className = "editor-field editor-range-field";

        const heading = document.createElement("div");
        heading.className = "range-heading";

        const label = document.createElement("span");
        label.className = "editor-field-label";
        label.textContent = labelText;

        const output = document.createElement("output");
        output.textContent = value;

        heading.appendChild(label);
        heading.appendChild(output);

        const input = document.createElement("input");
        input.type = "range";
        input.min = min;
        input.max = max;
        input.value = clamp(value, min, max);

        input.addEventListener("input", () => {
            output.textContent = input.value;
            onInput(Number(input.value));
        });

        input.addEventListener("change", onCommit);

        wrapper.appendChild(heading);
        wrapper.appendChild(input);
        elements.selectedObjectFields.appendChild(wrapper);

        return input;
    }

    function createEditorNumber(value, min, max, onChange) {
        const input = document.createElement("input");
        input.type = "number";
        input.min = min;
        input.max = max;
        input.step = "1";
        input.value = Math.round(value);

        input.addEventListener("change", () => {
            const parsed = Number(input.value);

            if (!Number.isFinite(parsed)) {
                input.value = Math.round(value);
                return;
            }

            const nextValue = clamp(Math.round(parsed), min, max);
            input.value = nextValue;
            onChange(nextValue);
        });

        return input;
    }

    function renderSelectedObjectEditor() {
        elements.selectedObjectFields.innerHTML = "";

        const object = getObjectById(state.selectedObjectId);

        if (!object) {
            elements.selectedObjectEditor.hidden = true;
            return;
        }

        elements.selectedObjectEditor.hidden = false;
        elements.selectedObjectTitle.textContent = actions.getObjectLabel(object);

        if (isGeometricObject(object) || object.type === "dot") {
            const positionRow = document.createElement("div");
            positionRow.className = "editor-position-row";

            const xInput = createEditorNumber(
                object.x,
                0,
                elements.canvas.width,
                value => {
                    object.x = value;
                    commitSelectedObjectEdit();
                }
            );

            const yInput = createEditorNumber(
                object.y,
                0,
                elements.canvas.height,
                value => {
                    object.y = value;
                    commitSelectedObjectEdit();
                }
            );

            const xField = document.createElement("label");
            xField.className = "editor-field";
            const xLabel = document.createElement("span");
            xLabel.className = "editor-field-label";
            xLabel.textContent = "X centre";
            xField.appendChild(xLabel);
            xField.appendChild(xInput);

            const yField = document.createElement("label");
            yField.className = "editor-field";
            const yLabel = document.createElement("span");
            yLabel.className = "editor-field-label";
            yLabel.textContent = "Y centre";
            yField.appendChild(yLabel);
            yField.appendChild(yInput);

            positionRow.appendChild(xField);
            positionRow.appendChild(yField);
            elements.selectedObjectFields.appendChild(positionRow);

            createEditorRange(
                "Size",
                object.size,
                10,
                Math.max(300, elements.canvas.width, elements.canvas.height),
                value => {
                    object.size = value;
                    actions.redrawAll();
                },
                commitSelectedObjectEdit
            );

            if (object.type === "polygon") {
                const sidesInput = createEditorNumber(
                    object.sides || config.DEFAULT_POLYGON_SIDES,
                    config.MIN_POLYGON_SIDES,
                    config.MAX_POLYGON_SIDES,
                    value => {
                        object.sides = value;
                        commitSelectedObjectEdit();
                    }
                );

                createEditorField("Polygon sides", sidesInput);
            }

            if (object.type === "star7") {
                const pointsInput = createEditorNumber(
                    object.points || config.DEFAULT_STAR_POINTS,
                    config.MIN_STAR_POINTS,
                    config.MAX_STAR_POINTS,
                    value => {
                        object.points = value;
                        commitSelectedObjectEdit();
                    }
                );

                createEditorField("Star points", pointsInput);
            }
        } else if (Array.isArray(object.path)) {
            const note = document.createElement("p");
            note.className = "editor-note";
            note.textContent = "This stroke can be moved by dragging it on the canvas.";
            elements.selectedObjectFields.appendChild(note);
        }

        if (object.type !== "eraser") {
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.value = object.color || "#202a3a";

            colorInput.addEventListener("input", () => {
                object.color = colorInput.value;
                actions.redrawAll();
            });

            colorInput.addEventListener("change", commitSelectedObjectEdit);
            createEditorField("Color", colorInput);
        }

        if (isGeometricObject(object) || object.type === "dot") {
            const fillField = document.createElement("label");
            fillField.className = "editor-checkbox-field";

            const fillInput = document.createElement("input");
            fillInput.type = "checkbox";
            fillInput.checked = Boolean(object.filled);
            fillInput.addEventListener("change", () => {
                object.filled = fillInput.checked;
                commitSelectedObjectEdit();
            });

            const fillText = document.createElement("span");
            fillText.textContent = "Filled";

            fillField.appendChild(fillInput);
            fillField.appendChild(fillText);
            elements.selectedObjectFields.appendChild(fillField);
        }

        if (object.type !== "fill") {
            const widthProperty = Array.isArray(object.path) ? "width" : "lineWidth";
            const currentWidth = object[widthProperty] || 2;

            createEditorRange(
                object.type === "eraser" ? "Eraser size" : "Stroke width",
                currentWidth,
                1,
                80,
                value => {
                    object[widthProperty] = value;
                    actions.redrawAll();
                },
                commitSelectedObjectEdit
            );
        }
    }

    function commitSelectedObjectEdit() {
        actions.recordHistory();
        actions.renderObjectList();
        renderSelectedObjectEditor();
        actions.redrawAll();
    }

    return {
        renderSelectedObjectEditor,
        commitSelectedObjectEdit
    };
}