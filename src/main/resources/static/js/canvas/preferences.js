// Persist editor preferences in localStorage.

import { elements, config, state, clamp, isValidColor } from "./context.js";

export function readPreferences() {
    try {
        const raw = localStorage.getItem(config.PREFERENCES_STORAGE_KEY);
        if (!raw) {
            return;
        }

        const preferences = JSON.parse(raw);
        if (!preferences || typeof preferences !== "object") {
            return;
        }

        const tool = preferences.currentTool === "free"
            ? "pencil"
            : preferences.currentTool;

        if (["select", "pencil", "eraser", "bucket", "circle", "square", "triangle", "star7", "polygon"].includes(tool)) {
            state.currentTool = tool;
        }

        if (isValidColor(preferences.color)) {
            elements.colorPicker.value = preferences.color;
        }

        if (Number.isFinite(Number(preferences.shapeSize))) {
            state.shapeSize = clamp(
                Math.round(Number(preferences.shapeSize)),
                Number(elements.shapeSizeInput.min) || 10,
                Number(elements.shapeSizeInput.max) || 300
            );
            elements.shapeSizeInput.value = state.shapeSize;
            elements.shapeSizeLabel.textContent = state.shapeSize;
        }

        if (Number.isFinite(Number(preferences.pencilWidth))) {
            state.pencilWidth = clamp(Math.round(Number(preferences.pencilWidth)), 1, 40);
        }

        if (Number.isFinite(Number(preferences.eraserWidth))) {
            state.eraserWidth = clamp(Math.round(Number(preferences.eraserWidth)), 1, 80);
        }

        if (typeof preferences.fillShapes === "boolean") {
            state.fillShapes = preferences.fillShapes;
            elements.fillToggle.checked = state.fillShapes;
            elements.fillLabel.textContent = state.fillShapes ? "Filled" : "Hollow";
        }

        if (Number.isFinite(Number(preferences.polygonSides))) {
            elements.polygonSidesInput.value = clamp(
                Math.round(Number(preferences.polygonSides)),
                config.MIN_POLYGON_SIDES,
                config.MAX_POLYGON_SIDES
            );
        }

        if (Number.isFinite(Number(preferences.starPoints))) {
            elements.starPointsInput.value = clamp(
                Math.round(Number(preferences.starPoints)),
                config.MIN_STAR_POINTS,
                config.MAX_STAR_POINTS
            );
        }

        if (Number.isFinite(Number(preferences.zoom))) {
            state.zoom = clamp(Number(preferences.zoom), config.MIN_ZOOM, config.MAX_ZOOM);
        }

        elements.strokeWidthInput.value = state.pencilWidth;
        elements.strokeWidthLabel.textContent = state.pencilWidth;
    } catch (error) {
        // The editor remains usable if preferences are unavailable or corrupt.
    }
}

export function savePreferences(getPolygonSides, getStarPoints) {
    try {
        localStorage.setItem(config.PREFERENCES_STORAGE_KEY, JSON.stringify({
            currentTool: state.currentTool,
            color: elements.colorPicker.value,
            shapeSize: state.shapeSize,
            pencilWidth: state.pencilWidth,
            eraserWidth: state.eraserWidth,
            fillShapes: state.fillShapes,
            polygonSides: getPolygonSides(),
            starPoints: getStarPoints(),
            zoom: state.zoom
        }));
    } catch (error) {
        // Preferences are best-effort only.
    }
}