// Canvas rendering: draw each stored object and the current selection/preview.

import {
    elements,
    context,
    config,
    state,
    getObjectById,
    isGeometricObject
} from "./context.js";
import { buildShapePath, buildStrokePath, getPreviewShapeSize } from "./geometry.js";
import { floodFillAt } from "./flood-fill.js";

export function drawGeometricObject(object, preview = false) {
    context.save();

    context.strokeStyle = object.color || "#202a3a";
    context.fillStyle = object.color || "#202a3a";
    context.lineWidth = object.lineWidth || 2;
    context.lineJoin = "round";
    context.lineCap = "round";

    if (preview) {
        context.globalAlpha = 0.72;
        context.setLineDash([6, 4]);
    }

    buildShapePath(object);

    if (object.filled) {
        context.fill();
    }

    context.stroke();
    context.restore();
}

export function drawPencilOrEraser(object) {
    if (!Array.isArray(object.path) || object.path.length === 0) {
        return;
    }

    context.save();
    context.lineWidth = Math.max(1, object.width || 2);
    context.lineCap = "round";
    context.lineJoin = "round";

    if (object.type === "eraser") {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = config.CANVAS_BACKGROUND_COLOR;
        context.fillStyle = config.CANVAS_BACKGROUND_COLOR;
    } else {
        context.strokeStyle = object.color || "#202a3a";
        context.fillStyle = object.color || "#202a3a";
    }

    if (object.path.length === 1) {
        const point = object.path[0];
        context.beginPath();
        context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
        context.fill();
    } else {
        buildStrokePath(object.path);
        context.stroke();
    }

    context.restore();
}

export function drawObject(object) {
    if (isGeometricObject(object) || object.type === "dot") {
        drawGeometricObject(object);
    } else if (
        object.type === "pencil" ||
        object.type === "free" ||
        object.type === "eraser"
    ) {
        drawPencilOrEraser(object);
    } else if (object.type === "fill") {
        floodFillAt(
            object.x,
            object.y,
            object.color,
            object.tolerance ?? config.FILL_TOLERANCE
        );
    }
}

export function drawSelectionOutline(object) {
    if (!object) {
        return;
    }

    let minX;
    let minY;
    let maxX;
    let maxY;

    if (isGeometricObject(object) || object.type === "dot") {
        const half = object.size / 2;
        minX = object.x - half;
        minY = object.y - half;
        maxX = object.x + half;
        maxY = object.y + half;
    } else if (Array.isArray(object.path) && object.path.length > 0) {
        minX = Infinity;
        minY = Infinity;
        maxX = -Infinity;
        maxY = -Infinity;

        for (const point of object.path) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        const strokePadding = (object.width || 2) / 2;
        minX -= strokePadding;
        minY -= strokePadding;
        maxX += strokePadding;
        maxY += strokePadding;
    } else {
        return;
    }

    const padding = 6;

    context.save();
    context.strokeStyle = "#3978df";
    context.lineWidth = 1.5;
    context.setLineDash([5, 4]);

    context.strokeRect(
        minX - padding,
        minY - padding,
        Math.max(1, maxX - minX + padding * 2),
        Math.max(1, maxY - minY + padding * 2)
    );

    context.restore();
}

export function redrawAll() {
    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    context.fillStyle = config.CANVAS_BACKGROUND_COLOR;
    context.fillRect(0, 0, elements.canvas.width, elements.canvas.height);

    for (const object of state.objects) {
        drawObject(object);
    }

    const selectedObject = getObjectById(state.selectedObjectId);

    if (selectedObject) {
        drawSelectionOutline(selectedObject);
    }

    if (state.isDrawing) {
        if (isGeometricObject({ type: state.currentTool })) {
            const preview = {
                type: state.currentTool,
                id: -1,
                x: state.startX,
                y: state.startY,
                size: getPreviewShapeSize(),
                color: elements.colorPicker.value,
                filled: state.fillShapes,
                lineWidth: state.pencilWidth,
                ...(state.currentTool === "polygon"
                    ? { sides: Number(elements.polygonSidesInput.value) || config.DEFAULT_POLYGON_SIDES }
                    : {}),
                ...(state.currentTool === "star7"
                    ? { points: Number(elements.starPointsInput.value) || config.DEFAULT_STAR_POINTS }
                    : {})
            };

            drawGeometricObject(preview, true);
        } else if (state.currentTool === "pencil" || state.currentTool === "eraser") {
            drawPencilOrEraser({
                type: state.currentTool,
                path: state.currentStrokePath,
                color: state.currentStrokeColor,
                width: state.currentStrokeWidth
            });
        }
    }
}