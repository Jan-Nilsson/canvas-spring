// Pointer-based drawing, selection and moving. Supports mouse, touch and stylus.

import {
    elements,
    context,
    config,
    state,
    getCanvasCoordinates,
    cloneObjects,
    getObjectById,
    isGeometricObject
} from "./context.js";

import { buildShapePath, buildStrokePath, createShapeObject, getPreviewShapeSize } from "./geometry.js";
import { setSelectionCursor, setToolCursor } from "./cursors.js";

export function createInteractions(actions) {
    function isPointOnObject(object, x, y) {
        if (
            object.type === "pencil" ||
            object.type === "free" ||
            object.type === "eraser"
        ) {
            if (!Array.isArray(object.path) || object.path.length === 0) {
                return false;
            }

            context.save();
            context.lineCap = "round";
            context.lineJoin = "round";
            context.lineWidth = Math.max(12, (object.width || 2) + config.HIT_TOLERANCE * 2);

            if (object.path.length === 1) {
                const point = object.path[0];
                context.beginPath();
                context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
                const hit = context.isPointInPath(x, y);
                context.restore();
                return hit;
            }

            buildStrokePath(object.path);
            const hit = context.isPointInStroke(x, y);
            context.restore();
            return hit;
        }

        if (!isGeometricObject(object) && object.type !== "dot") {
            return false;
        }

        context.save();
        buildShapePath(object);

        const inside = context.isPointInPath(x, y);
        context.lineWidth = Math.max(12, (object.lineWidth || 2) + config.HIT_TOLERANCE * 2);
        const onBorder = context.isPointInStroke(x, y);

        context.restore();
        return inside || onBorder;
    }

    function findObjectAtPosition(x, y) {
        for (let index = state.objects.length - 1; index >= 0; index--) {
            if (isPointOnObject(state.objects[index], x, y)) {
                return state.objects[index];
            }
        }

        return null;
    }

    function selectObject(objectId) {
        state.selectedObjectId = objectId;
        state.currentTool = "select";

        actions.updateToolControls();
        actions.savePreferences();
        actions.renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
    }

    function clearSelection() {
        state.selectedObjectId = null;
        actions.renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
    }

    function translateObjectFromSnapshot(object, original, dx, dy) {
        if (isGeometricObject(object) || object.type === "dot") {
            object.x = original.x + dx;
            object.y = original.y + dy;
            return;
        }

        if (Array.isArray(original.path)) {
            object.path = original.path.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }));
        }
    }

    function finishObjectMove() {
        if (!state.isDraggingObject) {
            return;
        }

        if (state.dragState && state.dragState.moved) {
            actions.recordHistory();
            actions.renderObjectList();
            actions.renderSelectedObjectEditor();
        }

        state.isDraggingObject = false;
        state.dragState = null;
        setToolCursor(elements.canvas, state.currentTool);
        actions.redrawAll();
    }

    function finishDrawing(event) {
        if (!state.isDrawing) {
            return;
        }

        const position = getCanvasCoordinates(event);
        state.pointerX = position.x;
        state.pointerY = position.y;
        state.isDrawing = false;

        if (isGeometricObject({ type: state.currentTool })) {
            const extras = {};

            if (state.currentTool === "polygon") {
                extras.sides = actions.getPolygonSides();
            } else if (state.currentTool === "star7") {
                extras.points = actions.getStarPoints();
            }

            actions.pushObject(createShapeObject(
                state.currentTool,
                state.startX,
                state.startY,
                getPreviewShapeSize(),
                extras
            ));
        } else if (state.currentTool === "pencil" || state.currentTool === "eraser") {
            const lastPoint = state.currentStrokePath[state.currentStrokePath.length - 1];

            if (
                lastPoint &&
                (
                    Math.abs(lastPoint.x - position.x) >= 0.5 ||
                    Math.abs(lastPoint.y - position.y) >= 0.5
                )
            ) {
                state.currentStrokePath.push({ x: position.x, y: position.y });
            }

            if (state.currentStrokePath.length > 0) {
                actions.pushObject({
                    type: state.currentTool,
                    id: state.nextObjectId++,
                    path: state.currentStrokePath.slice(),
                    ...(state.currentTool === "pencil"
                        ? { color: state.currentStrokeColor }
                        : {}),
                    width: state.currentStrokeWidth
                });
            }

            state.currentStrokePath = [];
        }

        actions.redrawAll();
    }

    function pointerDown(event) {
        if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
            return;
        }

        const position = getCanvasCoordinates(event);
        if (!position.inside) {
            return;
        }

        event.preventDefault();
        state.activePointerId = event.pointerId;
        state.pointerX = position.x;
        state.pointerY = position.y;

        try {
            elements.canvas.setPointerCapture(event.pointerId);
        } catch (error) {
            // Pointer capture is best-effort; the editor still works without it.
        }

        if (state.currentTool === "select") {
            const object = findObjectAtPosition(position.x, position.y);

            if (!object) {
                clearSelection();
                return;
            }

            selectObject(object.id);
            state.dragState = {
                objectId: object.id,
                startX: position.x,
                startY: position.y,
                original: cloneObjects([object])[0],
                moved: false
            };
            state.isDraggingObject = true;
            setSelectionCursor(elements.canvas, "grabbing");
            return;
        }

        if (state.currentTool === "pencil" || state.currentTool === "eraser") {
            state.isDrawing = true;
            state.startX = position.x;
            state.startY = position.y;
            state.currentStrokeColor = elements.colorPicker.value;
            state.currentStrokeWidth = state.currentTool === "eraser"
                ? state.eraserWidth
                : state.pencilWidth;
            state.currentStrokePath = [{ x: position.x, y: position.y }];
            actions.redrawAll();
            return;
        }

        if (state.currentTool === "bucket") {
            actions.pushObject({
                type: "fill",
                id: state.nextObjectId++,
                x: Math.floor(position.x),
                y: Math.floor(position.y),
                color: elements.colorPicker.value,
                tolerance: config.FILL_TOLERANCE
            });
            return;
        }

        if (isGeometricObject({ type: state.currentTool })) {
            state.isDrawing = true;
            state.startX = position.x;
            state.startY = position.y;
            actions.redrawAll();
        }
    }

    function pointerMove(event) {
        if (state.activePointerId !== null && event.pointerId !== state.activePointerId) {
            return;
        }

        const position = getCanvasCoordinates(event);
        state.pointerX = position.x;
        state.pointerY = position.y;

        if (state.isDraggingObject && state.dragState) {
            const object = getObjectById(state.dragState.objectId);

            if (!object) {
                finishObjectMove();
                return;
            }

            const dx = position.x - state.dragState.startX;
            const dy = position.y - state.dragState.startY;

            if (Math.hypot(dx, dy) >= config.DRAG_THRESHOLD) {
                state.dragState.moved = true;
            }

            if (state.dragState.moved) {
                translateObjectFromSnapshot(object, state.dragState.original, dx, dy);
                actions.redrawAll();
            }

            return;
        }

        if (!state.isDrawing) {
            if (state.activePointerId === null && state.currentTool === "select" && position.inside) {
                setSelectionCursor(
                    elements.canvas,
                    findObjectAtPosition(position.x, position.y) ? "grab" : "default"
                );
            }

            return;
        }

        if (isGeometricObject({ type: state.currentTool })) {
            actions.redrawAll();
            return;
        }

        if (state.currentTool === "pencil" || state.currentTool === "eraser") {
            const previous = state.currentStrokePath[state.currentStrokePath.length - 1];

            if (
                previous &&
                Math.abs(previous.x - position.x) < 0.5 &&
                Math.abs(previous.y - position.y) < 0.5
            ) {
                return;
            }

            state.currentStrokePath.push({ x: position.x, y: position.y });
            actions.redrawAll();
        }
    }

    function cancelPointer() {
        if (state.isDraggingObject && state.dragState) {
            const object = getObjectById(state.dragState.objectId);

            if (object) {
                translateObjectFromSnapshot(object, state.dragState.original, 0, 0);
            }
        }

        state.isDraggingObject = false;
        state.dragState = null;
        state.isDrawing = false;
        state.currentStrokePath = [];
        state.activePointerId = null;

        setToolCursor(elements.canvas, state.currentTool);
        actions.renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
    }

    function pointerUp(event) {
        if (state.activePointerId !== null && event.pointerId !== state.activePointerId) {
            return;
        }

        if (state.isDraggingObject) {
            finishObjectMove();
        } else {
            finishDrawing(event);
        }

        state.activePointerId = null;
    }

    function lostPointerCapture(event) {
        if (state.activePointerId !== null && event.pointerId === state.activePointerId) {
            cancelPointer();
        }
    }

    function wireInteractions() {
        elements.canvas.style.touchAction = "none";
        elements.canvas.addEventListener("pointerdown", pointerDown);
        elements.canvas.addEventListener("pointermove", pointerMove);
        elements.canvas.addEventListener("pointerup", pointerUp);
        elements.canvas.addEventListener("pointercancel", cancelPointer);
        elements.canvas.addEventListener("lostpointercapture", lostPointerCapture);

        elements.clearSelectionButton.addEventListener("click", clearSelection);
    }

    return {
        selectObject,
        clearSelection,
        findObjectAtPosition,
        wireInteractions
    };
}