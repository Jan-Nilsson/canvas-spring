// ==================================================
// ERROR BANNER
// ==================================================

window.addEventListener("error", e => {
    const box = document.createElement("div");

    box.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:9999;" +
        "background:#c0392b;color:#fff;padding:8px;font:14px monospace";

    box.textContent =
        `JS error: ${e.message} ` +
        `(${(e.filename || "").split("/").pop()}:${e.lineno})`;

    document.body.appendChild(box);
});

const missingIds = [];

function requireEl(id) {
    const element = document.getElementById(id);

    if (!element) {
        missingIds.push(id);
    }

    return element;
}


// ==================================================
// ELEMENTS
// ==================================================

const canvas = requireEl("drawingCanvas");
const canvasContainer = requireEl("canvasContainer");
const colorPicker = requireEl("colorPicker");
const objectList = requireEl("objectList");

const undoBtn = requireEl("undoBtn");
const redoBtn = requireEl("redoBtn");
const clearBtn = requireEl("clearBtn");

const saveForm = requireEl("saveForm");
const drawingDataInput = requireEl("drawingData");
const savedWidthInput = document.getElementById("savedCanvasWidth");
const savedHeightInput = document.getElementById("savedCanvasHeight");

const shapeSizeInput = requireEl("shapeSize");
const shapeSizeLabel = requireEl("shapeSizeLabel");
const freeWidthInput = requireEl("freeWidth");
const freeWidthLabel = requireEl("freeWidthLabel");
const freeWidthTitle = requireEl("freeWidthTitle");

const polygonOptions = requireEl("polygonOptions");
const polygonSidesInput = requireEl("polygonSides");
const starOptions = requireEl("starOptions");
const starPointsInput = requireEl("starPoints");

const canvasWidthInput = requireEl("canvasWidth");
const canvasHeightInput = requireEl("canvasHeight");
const resetCanvasSizeBtn = requireEl("resetCanvasSize");

const zoomOutBtn = requireEl("zoomOutBtn");
const zoomInBtn = requireEl("zoomInBtn");
const zoomResetBtn = requireEl("zoomResetBtn");
const zoomFitBtn = requireEl("zoomFitBtn");
const zoomLabel = requireEl("zoomLabel");

const fillToggle = requireEl("fillToggle");
const fillLabel = requireEl("fillLabel");
const colorControls = requireEl("colorControls");
const fillControls = requireEl("fillControls");
const shapeSizeControls = requireEl("shapeSizeControls");
const freeWidthControls = requireEl("freeWidthControls");

const appMessage = requireEl("appMessage");
const toolsPanel = requireEl("toolsPanel");
const objectsPanel = requireEl("objectsPanel");
const toggleToolsPanelBtn = requireEl("toggleToolsPanel");
const toggleObjectsPanelBtn = requireEl("toggleObjectsPanel");

const objectCount = requireEl("objectCount");
const emptyObjectsHint = requireEl("emptyObjectsHint");
const selectedObjectEditor = requireEl("selectedObjectEditor");
const selectedObjectTitle = requireEl("selectedObjectTitle");
const selectedObjectFields = requireEl("selectedObjectFields");
const clearSelectionBtn = requireEl("clearSelectionBtn");

const shapeButtons = document.querySelectorAll(".shape-btn");

if (missingIds.length > 0) {
    throw new Error("Missing HTML elements: " + missingIds.join(", "));
}

const ctx = canvas.getContext("2d");


// ==================================================
// CONSTANTS
// ==================================================

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;
const MIN_CANVAS_SIZE = 100;
const MAX_CANVAS_SIZE = 4000;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

const DEFAULT_POLYGON_SIDES = 5;
const MIN_POLYGON_SIDES = 3;
const MAX_POLYGON_SIDES = 50;

const DEFAULT_STAR_POINTS = 7;
const MIN_STAR_POINTS = 4;
const MAX_STAR_POINTS = 20;

const FRAME_BORDER_TOTAL = 2;
const CANVAS_BACKGROUND_COLOR = "#ffffff";
const HIT_TOLERANCE = 8;
const DRAG_THRESHOLD = 3;

const GEOMETRIC_TOOLS = new Set([
    "circle",
    "square",
    "triangle",
    "star7",
    "polygon"
]);


// ==================================================
// STATE
// ==================================================

let shapeSize = parseInt(shapeSizeInput.value, 10);
let freeWidth = parseInt(freeWidthInput.value, 10);
let eraserWidth = 20;
let fillShapes = fillToggle.checked;

// Select is the default tool. It allows users to select or move
// objects without first having to choose a drawing tool.
let currentTool = "select";

let isDrawing = false;
let isDraggingObject = false;
let dragState = null;

let startX = 0;
let startY = 0;
let pointerX = 0;
let pointerY = 0;

let objects = [];
let history = [];
let historyIndex = -1;

let currentFreePath = [];
let currentFreeColor = "#202a3a";
let currentFreeWidth = 2;

let nextObjectId = 1;
let selectedObjectId = null;
let hoverId = null;

let zoom = 1;
let messageTimer = null;


// ==================================================
// GENERAL HELPERS
// ==================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function cloneObjects(source = objects) {
    return JSON.parse(JSON.stringify(source));
}

function getObjectById(id) {
    return objects.find(object => object.id === id) || null;
}

function isGeometricObject(object) {
    return GEOMETRIC_TOOLS.has(object.type);
}


// ==================================================
// IN-APP MESSAGES
// ==================================================

function showMessage(text, type = "info") {
    appMessage.textContent = text;
    appMessage.className = `app-message ${type}`;
    appMessage.hidden = false;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        appMessage.hidden = true;
    }, 4000);
}


// ==================================================
// CANVAS COORDINATES
// ==================================================

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();

    const rawX = ((event.clientX - rect.left) / Math.max(rect.width, 1))
        * canvas.width;

    const rawY = ((event.clientY - rect.top) / Math.max(rect.height, 1))
        * canvas.height;

    const inside = (
        rawX >= 0 &&
        rawX <= canvas.width &&
        rawY >= 0 &&
        rawY <= canvas.height
    );

    return {
        x: clamp(rawX, 0, canvas.width),
        y: clamp(rawY, 0, canvas.height),
        inside
    };
}


// ==================================================
// PANEL VISIBILITY
// ==================================================

function setPanelVisibility(panel, button, visible) {
    panel.hidden = !visible;
    button.setAttribute("aria-expanded", String(visible));
    button.classList.toggle("active", visible);
}

toggleToolsPanelBtn.addEventListener("click", () => {
    setPanelVisibility(toolsPanel, toggleToolsPanelBtn, toolsPanel.hidden);
});

toggleObjectsPanelBtn.addEventListener("click", () => {
    setPanelVisibility(objectsPanel, toggleObjectsPanelBtn, objectsPanel.hidden);
});


// ==================================================
// TOOL SELECTION AND CONTEXTUAL CONTROLS
// ==================================================

function setCurrentTool(tool) {
    currentTool = tool;

    // Drawing tools leave selection mode. The selected object remains
    // in the document, but its property editor is closed until selected again.
    if (tool !== "select") {
        selectedObjectId = null;
        renderSelectedObjectEditor();
    }

    updateToolControls();
    renderObjectList();
    redrawAll();
}

function updateToolControls() {
    const isShape = GEOMETRIC_TOOLS.has(currentTool);
    const isFreeDraw = currentTool === "free";
    const isEraser = currentTool === "eraser";

    shapeSizeControls.hidden = !isShape;
    freeWidthControls.hidden = !(isFreeDraw || isEraser);
    fillControls.hidden = !isShape;
    colorControls.hidden = !(isShape || isFreeDraw);
    polygonOptions.hidden = currentTool !== "polygon";
    starOptions.hidden = currentTool !== "star7";

    freeWidthTitle.textContent = isEraser ? "Eraser size" : "Stroke width";
    freeWidthInput.max = isEraser ? "80" : "40";
    freeWidthInput.value = isEraser ? eraserWidth : freeWidth;
    freeWidthLabel.textContent = freeWidthInput.value;

    shapeButtons.forEach(button => {
        const selected = button.dataset.shape === currentTool;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    canvas.classList.toggle("select-tool", currentTool === "select");
    canvas.classList.toggle("drawing-tool", currentTool !== "select");
}

shapeButtons.forEach(button => {
    button.addEventListener("click", () => {
        setCurrentTool(button.dataset.shape);
    });
});


// ==================================================
// TOOL SETTINGS
// ==================================================

shapeSizeInput.addEventListener("input", () => {
    shapeSize = parseInt(shapeSizeInput.value, 10);
    shapeSizeLabel.textContent = shapeSize;
});

freeWidthInput.addEventListener("input", () => {
    const value = parseInt(freeWidthInput.value, 10);

    if (currentTool === "eraser") {
        eraserWidth = value;
    } else {
        freeWidth = value;
    }

    freeWidthLabel.textContent = value;
});

fillToggle.addEventListener("change", () => {
    fillShapes = fillToggle.checked;
    fillLabel.textContent = fillShapes ? "Filled" : "Hollow";
});


// ==================================================
// POLYGON SIDES
// ==================================================

function getPolygonSides() {
    const raw = polygonSidesInput.value.trim();
    const value = Math.round(Number(raw));

    if (raw === "" || !Number.isFinite(value)) {
        return DEFAULT_POLYGON_SIDES;
    }

    return clamp(value, MIN_POLYGON_SIDES, MAX_POLYGON_SIDES);
}

polygonSidesInput.addEventListener("change", () => {
    const original = polygonSidesInput.value.trim();
    const sides = getPolygonSides();

    polygonSidesInput.value = sides;

    if (original !== String(sides)) {
        showMessage(
            `Polygon sides must be between ${MIN_POLYGON_SIDES} ` +
            `and ${MAX_POLYGON_SIDES}.`,
            "warning"
        );
    }
});


// ==================================================
// STAR POINTS
// ==================================================

function getStarPoints() {
    const raw = starPointsInput.value.trim();
    const value = Math.round(Number(raw));

    if (raw === "" || !Number.isFinite(value)) {
        return DEFAULT_STAR_POINTS;
    }

    return clamp(value, MIN_STAR_POINTS, MAX_STAR_POINTS);
}

starPointsInput.addEventListener("change", () => {
    const original = starPointsInput.value.trim();
    const points = getStarPoints();

    starPointsInput.value = points;

    if (original !== String(points)) {
        showMessage(
            `Star points must be between ${MIN_STAR_POINTS} ` +
            `and ${MAX_STAR_POINTS}.`,
            "warning"
        );
    }
});


// ==================================================
// CANVAS SIZE
// ==================================================

function updateDisplaySize() {
    canvas.style.width = `${canvas.width * zoom}px`;
    canvas.style.height = `${canvas.height * zoom}px`;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";

    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function setCanvasSize(width, height) {
    canvas.width = width;
    canvas.height = height;

    canvasWidthInput.value = width;
    canvasHeightInput.value = height;

    updateDisplaySize();
    redrawAll();
}

function parseSizeInput(input, fallback) {
    const raw = input.value.trim();
    const value = Math.round(Number(raw));

    if (raw === "" || !Number.isFinite(value)) {
        return fallback;
    }

    return clamp(value, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
}

function commitCanvasSize() {
    const rawWidth = canvasWidthInput.value.trim();
    const rawHeight = canvasHeightInput.value.trim();

    const width = parseSizeInput(canvasWidthInput, canvas.width);
    const height = parseSizeInput(canvasHeightInput, canvas.height);

    const corrected =
        rawWidth !== String(width) ||
        rawHeight !== String(height);

    if (width !== canvas.width || height !== canvas.height) {
        setCanvasSize(width, height);
    } else {
        canvasWidthInput.value = width;
        canvasHeightInput.value = height;
    }

    if (corrected) {
        showMessage(
            `Canvas size must be between ${MIN_CANVAS_SIZE} ` +
            `and ${MAX_CANVAS_SIZE} px.`,
            "warning"
        );
    }
}

[canvasWidthInput, canvasHeightInput].forEach(input => {
    input.addEventListener("change", commitCanvasSize);

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitCanvasSize();
        }
    });
});

resetCanvasSizeBtn.addEventListener("click", () => {
    setCanvasSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
    setZoom(1);
});


// ==================================================
// ZOOM
// ==================================================

function setZoom(newZoom, anchorX, anchorY) {
    newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);

    if (newZoom === zoom) {
        return;
    }

    if (anchorX === undefined || anchorY === undefined) {
        const rect = canvasContainer.getBoundingClientRect();
        anchorX = rect.left + rect.width / 2;
        anchorY = rect.top + rect.height / 2;
    }

    const before = canvas.getBoundingClientRect();
    const canvasX = (anchorX - before.left) / zoom;
    const canvasY = (anchorY - before.top) / zoom;

    zoom = newZoom;
    updateDisplaySize();

    const after = canvas.getBoundingClientRect();

    canvasContainer.scrollLeft += after.left + canvasX * zoom - anchorX;
    canvasContainer.scrollTop += after.top + canvasY * zoom - anchorY;
}

function fitToView() {
    const availableWidth = canvasContainer.clientWidth - FRAME_BORDER_TOTAL;
    const availableHeight = canvasContainer.clientHeight - FRAME_BORDER_TOTAL;

    const fit = Math.min(
        1,
        availableWidth / canvas.width,
        availableHeight / canvas.height
    );

    setZoom(fit);
    canvasContainer.scrollTo(0, 0);
}

zoomInBtn.addEventListener("click", () => setZoom(zoom * ZOOM_STEP));
zoomOutBtn.addEventListener("click", () => setZoom(zoom / ZOOM_STEP));
zoomResetBtn.addEventListener("click", () => setZoom(1));
zoomFitBtn.addEventListener("click", fitToView);

canvasContainer.addEventListener("wheel", event => {
    if (!event.ctrlKey && !event.metaKey) {
        return;
    }

    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom(zoom * factor, event.clientX, event.clientY);
}, { passive: false });


// ==================================================
// SHAPE GEOMETRY
// All geometric objects are stored using their centre point.
// This keeps placement, movement and future rotation intuitive.
// ==================================================

function buildTrianglePath(object) {
    const radius = object.size / 2;

    ctx.beginPath();
    ctx.moveTo(object.x, object.y - radius);
    ctx.lineTo(object.x + radius, object.y + radius);
    ctx.lineTo(object.x - radius, object.y + radius);
    ctx.closePath();
}

function buildStarPath(cx, cy, spikes, outerRadius, innerRadius) {
    ctx.beginPath();

    // Start at the top and alternate outer/inner vertices evenly.
    // The same calculation works for every supported point count.
    for (let i = 0; i < spikes * 2; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
}

function buildPolygonPath(cx, cy, radius, sides) {
    const safeSides = Math.max(3, sides || DEFAULT_POLYGON_SIDES);

    ctx.beginPath();

    for (let i = 0; i < safeSides; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / safeSides;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
}

function buildShapePath(object) {
    switch (object.type) {
        case "circle":
            ctx.beginPath();
            ctx.arc(object.x, object.y, object.size / 2, 0, Math.PI * 2);
            break;

        case "square": {
            const half = object.size / 2;
            ctx.beginPath();
            ctx.rect(object.x - half, object.y - half, object.size, object.size);
            break;
        }

        case "triangle":
            buildTrianglePath(object);
            break;

        case "star7":
            buildStarPath(
                object.x,
                object.y,
                object.points || DEFAULT_STAR_POINTS,
                object.size / 2,
                object.size / 4
            );
            break;

        case "polygon":
            buildPolygonPath(object.x, object.y, object.size / 2, object.sides);
            break;

        case "dot":
            ctx.beginPath();
            ctx.arc(object.x, object.y, object.size / 2, 0, Math.PI * 2);
            break;

        default:
            ctx.beginPath();
    }
}

function buildStrokePath(path) {
    ctx.beginPath();

    if (!Array.isArray(path) || path.length === 0) {
        return;
    }

    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
}

function createShapeObject(type, x, y, size, extraProperties = {}) {
    return {
        type,
        id: nextObjectId++,
        x,
        y,
        size,
        color: colorPicker.value,
        filled: fillShapes,
        lineWidth: freeWidth,
        ...extraProperties
    };
}


// ==================================================
// OBJECT MANAGEMENT
// ==================================================

function pushObject(object) {
    objects.push(object);

    // A new operation invalidates the previous redo branch.
    recordHistory();

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
}


// ==================================================
// DRAW OBJECTS
// ==================================================

function drawGeometricObject(object, preview = false) {
    ctx.save();

    ctx.strokeStyle = object.color || "#202a3a";
    ctx.fillStyle = object.color || "#202a3a";
    ctx.lineWidth = object.lineWidth || 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (preview) {
        ctx.globalAlpha = 0.72;
        ctx.setLineDash([6, 4]);
    }

    buildShapePath(object);

    if (object.filled) {
        ctx.fill();
    }

    ctx.stroke();
    ctx.restore();
}

function drawFreePath(object) {
    if (!Array.isArray(object.path) || object.path.length === 0) {
        return;
    }

    ctx.save();
    ctx.lineWidth = Math.max(1, object.width || 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (object.type === "eraser") {
        // The eraser is an ordinary free-draw stroke painted with the
        // canvas background colour. It remains an ordered operation
        // in the drawing data and can be moved or undone.
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = CANVAS_BACKGROUND_COLOR;
        ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
    } else {
        ctx.strokeStyle = object.color || "#202a3a";
        ctx.fillStyle = object.color || "#202a3a";
    }

    if (object.path.length === 1) {
        const point = object.path[0];

        ctx.beginPath();
        ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        buildStrokePath(object.path);
        ctx.stroke();
    }

    ctx.restore();
}

function drawObject(object) {
    if (isGeometricObject(object) || object.type === "dot") {
        drawGeometricObject(object);
    } else if (object.type === "free" || object.type === "eraser") {
        drawFreePath(object);
    }
}

function drawSelectionOutline(object) {
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
        minX = Math.min(...object.path.map(point => point.x));
        minY = Math.min(...object.path.map(point => point.y));
        maxX = Math.max(...object.path.map(point => point.x));
        maxY = Math.max(...object.path.map(point => point.y));

        const padding = (object.width || 2) / 2;

        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
    } else {
        return;
    }

    const padding = 6;

    ctx.save();
    ctx.strokeStyle = "#3978df";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    ctx.strokeRect(
        minX - padding,
        minY - padding,
        Math.max(1, maxX - minX + padding * 2),
        Math.max(1, maxY - minY + padding * 2)
    );

    ctx.restore();
}

function getPreviewShapeSize() {
    const distance = Math.hypot(pointerX - startX, pointerY - startY);

    if (distance < DRAG_THRESHOLD) {
        return shapeSize;
    }

    return clamp(distance * 2, 10, Math.max(canvas.width, canvas.height) * 2);
}

function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const object of objects) {
        drawObject(object);
    }

    const selectedObject = getObjectById(selectedObjectId);

    if (selectedObject) {
        drawSelectionOutline(selectedObject);
    }

    // Render the in-progress operation on top without adding it to history yet.
    if (isDrawing) {
        if (GEOMETRIC_TOOLS.has(currentTool)) {
            const preview = {
                type: currentTool,
                id: -1,
                x: startX,
                y: startY,
                size: getPreviewShapeSize(),
                color: colorPicker.value,
                filled: fillShapes,
                lineWidth: freeWidth,
                ...(currentTool === "polygon"
                    ? { sides: getPolygonSides() }
                    : {}),
                ...(currentTool === "star7"
                    ? { points: getStarPoints() }
                    : {})
            };

            drawGeometricObject(preview, true);
        } else if (currentTool === "free" || currentTool === "eraser") {
            drawFreePath({
                type: currentTool,
                path: currentFreePath,
                color: currentFreeColor,
                width: currentFreeWidth
            });
        }
    }
}


// ==================================================
// HIT TESTING / SELECTION
// ==================================================

function isPointOnObject(object, x, y) {
    if (object.type === "eraser" || object.type === "free") {
        if (!Array.isArray(object.path) || object.path.length === 0) {
            return false;
        }

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(
            12,
            (object.width || 2) + HIT_TOLERANCE * 2
        );

        if (object.path.length === 1) {
            const point = object.path[0];

            ctx.beginPath();
            ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);

            const hit = ctx.isPointInPath(x, y);

            ctx.restore();
            return hit;
        }

        buildStrokePath(object.path);

        const hit = ctx.isPointInStroke(x, y);

        ctx.restore();
        return hit;
    }

    if (!isGeometricObject(object) && object.type !== "dot") {
        return false;
    }

    ctx.save();
    buildShapePath(object);

    // For hollow shapes, the interior is selectable as well as the outline.
    // This is more forgiving than requiring a click on a thin border.
    const inside = ctx.isPointInPath(x, y);

    ctx.lineWidth = Math.max(
        12,
        (object.lineWidth || 2) + HIT_TOLERANCE * 2
    );

    const onBorder = ctx.isPointInStroke(x, y);

    ctx.restore();

    return inside || onBorder;
}

function findObjectAtPosition(x, y) {
    // Reverse order means the visually topmost object gets selected first.
    for (let index = objects.length - 1; index >= 0; index--) {
        if (isPointOnObject(objects[index], x, y)) {
            return objects[index];
        }
    }

    return null;
}

function selectObject(objectId) {
    selectedObjectId = objectId;
    currentTool = "select";

    updateToolControls();
    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
}

function clearSelection() {
    selectedObjectId = null;

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
}

clearSelectionBtn.addEventListener("click", clearSelection);


// ==================================================
// MOVE SELECTED OBJECT
// ==================================================

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
    if (!isDraggingObject) {
        return;
    }

    if (dragState && dragState.moved) {
        recordHistory();
        renderObjectList();
        renderSelectedObjectEditor();
    }

    isDraggingObject = false;
    dragState = null;

    canvas.style.cursor = currentTool === "select" ? "default" : "crosshair";

    redrawAll();
}


// ==================================================
// MOUSE / POINTER DRAWING
// ==================================================

canvas.addEventListener("mousedown", event => {
    if (event.button !== 0) {
        return;
    }

    const position = getCanvasCoordinates(event);

    if (!position.inside) {
        return;
    }

    pointerX = position.x;
    pointerY = position.y;

    // Selection and movement.
    if (currentTool === "select") {
        const object = findObjectAtPosition(position.x, position.y);

        if (!object) {
            clearSelection();
            return;
        }

        selectObject(object.id);

        dragState = {
            objectId: object.id,
            startX: position.x,
            startY: position.y,
            original: cloneObjects([object])[0],
            moved: false
        };

        isDraggingObject = true;
        canvas.style.cursor = "grabbing";

        return;
    }

    // Free drawing and erasing.
    if (currentTool === "free" || currentTool === "eraser") {
        isDrawing = true;

        startX = position.x;
        startY = position.y;
        pointerX = position.x;
        pointerY = position.y;

        currentFreeColor = colorPicker.value;
        currentFreeWidth = currentTool === "eraser"
            ? eraserWidth
            : freeWidth;

        currentFreePath = [{ x: startX, y: startY }];

        redrawAll();
        return;
    }

    // Geometric shapes.
    if (GEOMETRIC_TOOLS.has(currentTool)) {
        isDrawing = true;

        startX = position.x;
        startY = position.y;
        pointerX = position.x;
        pointerY = position.y;

        redrawAll();
    }
});

window.addEventListener("mousemove", event => {
    const position = getCanvasCoordinates(event);

    pointerX = position.x;
    pointerY = position.y;

    // Moving a selected object.
    if (isDraggingObject && dragState) {
        const object = getObjectById(dragState.objectId);

        if (!object) {
            finishObjectMove();
            return;
        }

        const dx = position.x - dragState.startX;
        const dy = position.y - dragState.startY;

        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
            dragState.moved = true;
        }

        if (dragState.moved) {
            translateObjectFromSnapshot(
                object,
                dragState.original,
                dx,
                dy
            );

            redrawAll();
        }

        return;
    }

    // Hover cursor when using Select.
    if (!isDrawing) {
        if (currentTool === "select" && position.inside) {
            canvas.style.cursor = findObjectAtPosition(position.x, position.y)
                ? "grab"
                : "default";
        }

        return;
    }

    // Shape preview.
    if (GEOMETRIC_TOOLS.has(currentTool)) {
        redrawAll();
        return;
    }

    // Free drawing / eraser movement.
    if (currentTool === "free" || currentTool === "eraser") {
        const previousPoint = currentFreePath[currentFreePath.length - 1];

        if (!previousPoint) {
            return;
        }

        if (
            Math.abs(previousPoint.x - position.x) < 0.5 &&
            Math.abs(previousPoint.y - position.y) < 0.5
        ) {
            return;
        }

        currentFreePath.push({
            x: position.x,
            y: position.y
        });

        redrawAll();
    }
});

function finishDrawing(event) {
    if (!isDrawing) {
        return;
    }

    const position = getCanvasCoordinates(event);

    pointerX = position.x;
    pointerY = position.y;

    isDrawing = false;

    // Finish geometric shape.
    if (GEOMETRIC_TOOLS.has(currentTool)) {
        const size = getPreviewShapeSize();

        let extras = {};

        if (currentTool === "polygon") {
            extras = {
                sides: getPolygonSides()
            };
        } else if (currentTool === "star7") {
            extras = {
                points: getStarPoints()
            };
        }

        pushObject(createShapeObject(
            currentTool,
            startX,
            startY,
            size,
            extras
        ));
    }

    // Finish free-draw or eraser path.
    else if (currentTool === "free" || currentTool === "eraser") {
        const lastPoint = currentFreePath[currentFreePath.length - 1];

        if (
            lastPoint &&
            (
                Math.abs(lastPoint.x - position.x) >= 0.5 ||
                Math.abs(lastPoint.y - position.y) >= 0.5
            )
        ) {
            currentFreePath.push({
                x: position.x,
                y: position.y
            });
        }

        if (currentFreePath.length > 0) {
            pushObject({
                type: currentTool,
                id: nextObjectId++,
                path: currentFreePath.slice(),
                ...(currentTool === "free"
                    ? { color: currentFreeColor }
                    : {}),
                width: currentFreeWidth
            });
        }

        currentFreePath = [];
    }

    redrawAll();
}

window.addEventListener("mouseup", event => {
    if (isDraggingObject) {
        finishObjectMove();
        return;
    }

    finishDrawing(event);
});


// ==================================================
// UNDO / REDO HISTORY
// ==================================================

function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}

function resetHistory() {
    history = [cloneObjects()];
    historyIndex = 0;

    updateHistoryButtons();
}

function recordHistory() {
    // Any new edit after Undo discards the old redo branch.
    history = history.slice(0, historyIndex + 1);

    history.push(cloneObjects());
    historyIndex = history.length - 1;

    updateHistoryButtons();
}

function restoreHistoryState() {
    objects = cloneObjects(history[historyIndex]);

    selectedObjectId = null;
    hoverId = null;

    const maxId = objects.reduce(
        (max, object) => Math.max(max, Number(object.id) || 0),
        0
    );

    nextObjectId = Math.max(nextObjectId, maxId + 1);

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();

    updateHistoryButtons();
}

function undo() {
    if (historyIndex <= 0) {
        return;
    }

    historyIndex--;
    restoreHistoryState();
}

function redo() {
    if (historyIndex >= history.length - 1) {
        return;
    }

    historyIndex++;
    restoreHistoryState();
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

clearBtn.addEventListener("click", () => {
    if (objects.length === 0) {
        return;
    }

    objects = [];
    selectedObjectId = null;
    hoverId = null;

    recordHistory();

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
});


// ==================================================
// OBJECT LIST
// ==================================================

function getObjectLabel(object) {
    const fillText = object.filled ? "Filled" : "Hollow";

    switch (object.type) {
        case "circle":
            return `Circle · ${fillText}`;

        case "square":
            return `Square · ${fillText}`;

        case "triangle":
            return `Triangle · ${fillText}`;

        case "star7":
            return `${object.points || DEFAULT_STAR_POINTS}-pointed star`;

        case "polygon":
            return `${object.sides}-sided polygon · ${fillText}`;

        case "free":
            return "Free-draw stroke";

        case "eraser":
            return "Eraser stroke";

        case "dot":
            return "Free-draw dot";

        default:
            return "Object";
    }
}

function renderObjectList() {
    objectList.innerHTML = "";

    objectCount.textContent = objects.length;
    emptyObjectsHint.hidden = objects.length > 0;

    objects.forEach((object, index) => {
        const item = document.createElement("li");
        const label = document.createElement("button");
        const deleteButton = document.createElement("button");

        item.className = "object-item";
        item.dataset.id = object.id;

        if (object.id === selectedObjectId) {
            item.classList.add("selected");
        }

        label.type = "button";
        label.className = "object-select-button";
        label.textContent = `${index + 1}. ${getObjectLabel(object)}`;

        label.addEventListener("click", () => {
            selectObject(object.id);
        });

        deleteButton.type = "button";
        deleteButton.className = "del-btn";
        deleteButton.textContent = "×";
        deleteButton.title = "Delete object";
        deleteButton.setAttribute("aria-label", "Delete object");

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            deleteObject(object.id);
        });

        item.appendChild(label);
        item.appendChild(deleteButton);

        item.addEventListener("mouseenter", () => {
            hoverId = object.id;
            redrawAll();
            deleteButton.style.display = "inline-flex";
        });

        item.addEventListener("mouseleave", () => {
            hoverId = null;
            redrawAll();
            deleteButton.style.display = "none";
        });

        objectList.appendChild(item);
    });
}

function deleteObject(objectId) {
    const index = objects.findIndex(object => object.id === objectId);

    if (index === -1) {
        return;
    }

    objects.splice(index, 1);

    if (selectedObjectId === objectId) {
        selectedObjectId = null;
    }

    hoverId = null;

    recordHistory();

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
}


// ==================================================
// SELECTED OBJECT PROPERTY EDITOR
// ==================================================

function createEditorField(labelText, control) {
    const wrapper = document.createElement("label");
    wrapper.className = "editor-field";

    const label = document.createElement("span");
    label.className = "editor-field-label";
    label.textContent = labelText;

    wrapper.appendChild(label);
    wrapper.appendChild(control);

    selectedObjectFields.appendChild(wrapper);

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

    selectedObjectFields.appendChild(wrapper);

    return input;
}

function createEditorNumber(labelText, value, min, max, onChange) {
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
    selectedObjectFields.innerHTML = "";

    const object = getObjectById(selectedObjectId);

    if (!object) {
        selectedObjectEditor.hidden = true;
        return;
    }

    selectedObjectEditor.hidden = false;
    selectedObjectTitle.textContent = getObjectLabel(object);

    // Geometric object properties.
    if (isGeometricObject(object) || object.type === "dot") {
        const positionRow = document.createElement("div");
        positionRow.className = "editor-position-row";

        const xInput = createEditorNumber(
            "X centre",
            object.x,
            0,
            canvas.width,
            value => {
                object.x = value;
                commitSelectedObjectEdit();
            }
        );

        const yInput = createEditorNumber(
            "Y centre",
            object.y,
            0,
            canvas.height,
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

        selectedObjectFields.appendChild(positionRow);

        createEditorRange(
            "Size",
            object.size,
            10,
            Math.max(300, canvas.width, canvas.height),
            value => {
                object.size = value;
                redrawAll();
            },
            commitSelectedObjectEdit
        );

        // Polygon-specific properties.
        if (object.type === "polygon") {
            const sidesInput = createEditorNumber(
                "Number of sides",
                object.sides || DEFAULT_POLYGON_SIDES,
                MIN_POLYGON_SIDES,
                MAX_POLYGON_SIDES,
                value => {
                    object.sides = value;
                    commitSelectedObjectEdit();
                }
            );

            createEditorField("Polygon sides", sidesInput);
        }

        // Star-specific properties.
        if (object.type === "star7") {
            const pointsInput = createEditorNumber(
                "Number of points",
                object.points || DEFAULT_STAR_POINTS,
                MIN_STAR_POINTS,
                MAX_STAR_POINTS,
                value => {
                    object.points = value;
                    commitSelectedObjectEdit();
                }
            );

            createEditorField("Star points", pointsInput);
        }
    }

    // Free drawing and eraser strokes.
    else if (Array.isArray(object.path)) {
        const note = document.createElement("p");

        note.className = "editor-note";
        note.textContent = "This stroke can be moved by dragging it on the canvas.";

        selectedObjectFields.appendChild(note);
    }

    // Color is not editable for the eraser.
    if (object.type !== "eraser") {
        const colorInput = document.createElement("input");

        colorInput.type = "color";
        colorInput.value = object.color || "#202a3a";

        colorInput.addEventListener("input", () => {
            object.color = colorInput.value;
            redrawAll();
        });

        colorInput.addEventListener("change", () => {
            commitSelectedObjectEdit();
        });

        createEditorField("Color", colorInput);
    }

    // Fill only applies to geometric figures.
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

        selectedObjectFields.appendChild(fillField);
    }

    // Stroke width for free draw and geometric outlines.
    const widthProperty = Array.isArray(object.path) ? "width" : "lineWidth";
    const currentWidth = object[widthProperty] || 2;

    createEditorRange(
        object.type === "eraser" ? "Eraser size" : "Stroke width",
        currentWidth,
        1,
        80,
        value => {
            object[widthProperty] = value;
            redrawAll();
        },
        commitSelectedObjectEdit
    );
}

function commitSelectedObjectEdit() {
    recordHistory();

    renderObjectList();
    renderSelectedObjectEditor();
    redrawAll();
}


// ==================================================
// KEYBOARD SHORTCUTS
// ==================================================

document.addEventListener("keydown", event => {
    if ((!event.ctrlKey && !event.metaKey) || event.altKey) {
        return;
    }

    const target = event.target;

    // Preserve normal editing shortcuts while typing into a field.
    if (
        target instanceof HTMLElement &&
        (
            target.isContentEditable ||
            target.matches("input, textarea, select")
        )
    ) {
        return;
    }

    const key = event.key.toLowerCase();

    if (key === "z") {
        event.preventDefault();

        if (event.shiftKey) {
            redo();
        } else {
            undo();
        }
    } else if (key === "y") {
        event.preventDefault();
        redo();
    }
});


// ==================================================
// SAVE DRAWING
// ==================================================

saveForm.addEventListener("submit", event => {
    if (objects.length === 0) {
        event.preventDefault();

        showMessage(
            "The drawing is empty. Draw something before saving.",
            "warning"
        );

        return;
    }

    drawingDataInput.value = JSON.stringify(objects);

    if (savedWidthInput) {
        savedWidthInput.value = canvas.width;
    }

    if (savedHeightInput) {
        savedHeightInput.value = canvas.height;
    }
});


// ==================================================
// INITIALIZATION
// ==================================================

setCanvasSize(
    parseSizeInput(canvasWidthInput, DEFAULT_CANVAS_WIDTH),
    parseSizeInput(canvasHeightInput, DEFAULT_CANVAS_HEIGHT)
);

updateToolControls();
renderObjectList();
renderSelectedObjectEditor();
resetHistory();

if (appMessage.dataset.initialMessage) {
    showMessage(
        appMessage.dataset.initialMessage,
        appMessage.dataset.initialType || "info"
    );
}