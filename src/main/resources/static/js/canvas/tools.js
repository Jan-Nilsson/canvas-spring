// Tool selection, contextual controls and panel visibility.

import {
    elements,
    config,
    state,
    clamp,
    validTools,
    geometricTools,
    showMessage
} from "./context.js";
import { setToolCursor } from "./cursors.js";

export function createTools(actions) {
    function getPolygonSides() {
        const raw = elements.polygonSidesInput.value.trim();
        const value = Math.round(Number(raw));

        if (raw === "" || !Number.isFinite(value)) {
            return config.DEFAULT_POLYGON_SIDES;
        }

        return clamp(value, config.MIN_POLYGON_SIDES, config.MAX_POLYGON_SIDES);
    }

    function getStarPoints() {
        const raw = elements.starPointsInput.value.trim();
        const value = Math.round(Number(raw));

        if (raw === "" || !Number.isFinite(value)) {
            return config.DEFAULT_STAR_POINTS;
        }

        return clamp(value, config.MIN_STAR_POINTS, config.MAX_STAR_POINTS);
    }

    function updateToolControls() {
        const isShape = geometricTools.has(state.currentTool);
        const isPencil = state.currentTool === "pencil";
        const isEraser = state.currentTool === "eraser";
        const isBucket = state.currentTool === "bucket";

        elements.shapeSizeControls.hidden = !isShape;
        elements.strokeWidthControls.hidden = !(isPencil || isEraser);
        elements.fillControls.hidden = !isShape;
        elements.colorControls.hidden = !(isShape || isPencil || isBucket);
        elements.polygonOptions.hidden = state.currentTool !== "polygon";
        elements.starOptions.hidden = state.currentTool !== "star7";

        elements.strokeWidthTitle.textContent = isEraser ? "Eraser size" : "Stroke width";
        elements.strokeWidthInput.max = isEraser ? "80" : "40";
        elements.strokeWidthInput.value = isEraser ? state.eraserWidth : state.pencilWidth;
        elements.strokeWidthLabel.textContent = elements.strokeWidthInput.value;

        elements.shapeButtons.forEach(button => {
            const selected = button.dataset.shape === state.currentTool;
            button.classList.toggle("active", selected);
            button.setAttribute("aria-pressed", String(selected));
        });

        elements.canvas.classList.toggle("select-tool", state.currentTool === "select");
        elements.canvas.classList.toggle("drawing-tool", state.currentTool !== "select");
        setToolCursor(elements.canvas, state.currentTool);
    }

    function setCurrentTool(tool) {
        if (!validTools.has(tool)) {
            return;
        }

        state.currentTool = tool;

        if (tool !== "select") {
            state.selectedObjectId = null;
            actions.renderSelectedObjectEditor();
        }

        updateToolControls();
        actions.renderObjectList();
        actions.redrawAll();
        actions.savePreferences();
    }

    function setPanelVisibility(panel, button, visible) {
        panel.hidden = !visible;
        button.setAttribute("aria-expanded", String(visible));
        button.classList.toggle("active", visible);

        const label = panel.id === "toolsPanel" ? "tools" : "objects";
        button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} ${label}`);

        try {
            localStorage.setItem(`canvas.${panel.id}.visible`, String(visible));
        } catch (error) {
            // Panel visibility remains usable if browser storage is unavailable.
        }
    }

    function restorePanelVisibility(panel, button) {
        try {
            const stored = localStorage.getItem(`canvas.${panel.id}.visible`);
            setPanelVisibility(panel, button, stored !== "false");
        } catch (error) {
            setPanelVisibility(panel, button, true);
        }
    }

    function wireTools() {
        elements.shapeButtons.forEach(button => {
            button.addEventListener("click", () => setCurrentTool(button.dataset.shape));
        });

        elements.shapeSizeInput.addEventListener("input", () => {
            state.shapeSize = Number(elements.shapeSizeInput.value);
            elements.shapeSizeLabel.textContent = state.shapeSize;
            actions.savePreferences();
        });

        elements.strokeWidthInput.addEventListener("input", () => {
            const value = Number(elements.strokeWidthInput.value);

            if (state.currentTool === "eraser") {
                state.eraserWidth = value;
            } else {
                state.pencilWidth = value;
            }

            elements.strokeWidthLabel.textContent = value;
            actions.savePreferences();
        });

        elements.fillToggle.addEventListener("change", () => {
            state.fillShapes = elements.fillToggle.checked;
            elements.fillLabel.textContent = state.fillShapes ? "Filled" : "Hollow";
            actions.savePreferences();
        });

        elements.colorPicker.addEventListener("input", actions.savePreferences);

        elements.polygonSidesInput.addEventListener("change", () => {
            const original = elements.polygonSidesInput.value.trim();
            const sides = getPolygonSides();
            elements.polygonSidesInput.value = sides;

            if (original !== String(sides)) {
                showMessage(
                    `Polygon sides must be between ${config.MIN_POLYGON_SIDES} and ${config.MAX_POLYGON_SIDES}.`,
                    "warning"
                );
            }

            actions.savePreferences();
        });

        elements.starPointsInput.addEventListener("change", () => {
            const original = elements.starPointsInput.value.trim();
            const points = getStarPoints();
            elements.starPointsInput.value = points;

            if (original !== String(points)) {
                showMessage(
                    `Star points must be between ${config.MIN_STAR_POINTS} and ${config.MAX_STAR_POINTS}.`,
                    "warning"
                );
            }

            actions.savePreferences();
        });
    }

    function wirePanels() {
        elements.toggleToolsPanelButton.addEventListener("click", () => {
            setPanelVisibility(
                elements.toolsPanel,
                elements.toggleToolsPanelButton,
                elements.toolsPanel.hidden
            );
        });

        elements.toggleObjectsPanelButton.addEventListener("click", () => {
            setPanelVisibility(
                elements.objectsPanel,
                elements.toggleObjectsPanelButton,
                elements.objectsPanel.hidden
            );
        });

        restorePanelVisibility(elements.toolsPanel, elements.toggleToolsPanelButton);
        restorePanelVisibility(elements.objectsPanel, elements.toggleObjectsPanelButton);
    }

    return {
        getPolygonSides,
        getStarPoints,
        updateToolControls,
        setCurrentTool,
        wireTools,
        wirePanels
    };
}