// --------------------------------------------------
// ELEMENTS
// --------------------------------------------------

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvasContainer");

const colorPicker = document.getElementById("colorPicker");
const shapeButtons = document.querySelectorAll(".shape-btn");
const objectList = document.getElementById("objectList");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

const saveForm = document.getElementById("saveForm");
const drawingDataInput = document.getElementById("drawingData");

const shapeSizeInput = document.getElementById("shapeSize");
const shapeSizeLabel = document.getElementById("shapeSizeLabel");

const freeWidthInput = document.getElementById("freeWidth");
const freeWidthLabel = document.getElementById("freeWidthLabel");

const polygonOptions = document.getElementById("polygonOptions");
const polygonSidesInput = document.getElementById("polygonSides");

const canvasWidthInput = document.getElementById("canvasWidth");
const canvasHeightInput = document.getElementById("canvasHeight");
const resetCanvasSizeBtn = document.getElementById("resetCanvasSize");

const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const zoomFitBtn = document.getElementById("zoomFitBtn");
const zoomLabel = document.getElementById("zoomLabel");

const fillToggle = document.getElementById("fillToggle");
const fillLabel = document.getElementById("fillLabel");

const appMessage = document.getElementById("appMessage");


// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

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

// Border of .canvas-frame (2px on each side).
const FRAME_BORDER_TOTAL = 4;


// --------------------------------------------------
// STATE
// --------------------------------------------------

let shapeSize = parseInt(shapeSizeInput.value, 10);
let freeWidth = parseInt(freeWidthInput.value, 10);
let fillShapes = fillToggle.checked;

let currentShape = null;
let drawing = false;

let startX = 0;
let startY = 0;

let objects = [];
let undoneObjects = [];

let moved = false;
let currentFreePath = [];
let currentFreeColor = "#000000";
let currentFreeWidth = 2;

let nextObjectId = 1;
let hoverId = null;

let zoom = 1;
let messageTimer = null;


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


// --------------------------------------------------
// IN-APP MESSAGES (instead of alert / prompt)
// --------------------------------------------------

function showMessage(text, type = "info") {
    if (!appMessage) {
        return;
    }

    appMessage.textContent = text;
    appMessage.className = `app-message ${type}`;
    appMessage.hidden = false;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        appMessage.hidden = true;
    }, 4000);
}


// --------------------------------------------------
// COORDINATE CONVERSION
// --------------------------------------------------

// The canvas has no border or padding, so its bounding rect is exactly
// the drawing area. Converting by proportion works at any displayed
// size (zoom, CSS limits, etc.).
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();

    const rawX = ((e.clientX - rect.left) / Math.max(rect.width, 1))
        * canvas.width;

    const rawY = ((e.clientY - rect.top) / Math.max(rect.height, 1))
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
        inside: inside
    };
}


// --------------------------------------------------
// SHAPE SIZE / FREE WIDTH / FILL
// --------------------------------------------------

shapeSizeInput.addEventListener("input", () => {
    shapeSize = parseInt(shapeSizeInput.value, 10);
    shapeSizeLabel.textContent = shapeSize;
});

freeWidthInput.addEventListener("input", () => {
    freeWidth = parseInt(freeWidthInput.value, 10);
    freeWidthLabel.textContent = freeWidth;
});

fillToggle.addEventListener("change", () => {
    fillShapes = fillToggle.checked;
    fillLabel.textContent = fillShapes ? "Filled" : "Hollow";
});


// --------------------------------------------------
// POLYGON SIDES (replaces the browser prompt)
// --------------------------------------------------

function getPolygonSides() {
    const value = Math.round(Number(polygonSidesInput.value));

    if (!Number.isFinite(value) || polygonSidesInput.value.trim() === "") {
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


// --------------------------------------------------
// CANVAS SIZE
// --------------------------------------------------

function updateDisplaySize() {
    canvas.style.width = `${canvas.width * zoom}px`;
    canvas.style.height = `${canvas.height * zoom}px`;

    // Guard against external CSS shrinking the canvas.
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
    const value = Math.round(Number(input.value));

    if (input.value.trim() === "" || !Number.isFinite(value)) {
        return fallback;
    }

    return clamp(value, MIN_CANVAS_SIZE, MAX_CANVAS_SIZE);
}

// Applies the values typed in the inputs (Enter or losing focus).
function commitCanvasSize() {
    const rawWidth = canvasWidthInput.value.trim();
    const rawHeight = canvasHeightInput.value.trim();

    const width = parseSizeInput(canvasWidthInput, canvas.width);
    const height = parseSizeInput(canvasHeightInput, canvas.height);

    const corrected =
        rawWidth !== String(width) || rawHeight !== String(height);

    if (width !== canvas.width || height !== canvas.height) {
        setCanvasSize(width, height);
    } else {
        // Same size: only rewrite the inputs with valid values.
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

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            commitCanvasSize();
        }
    });
});

resetCanvasSizeBtn.addEventListener("click", () => {
    setCanvasSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
    setZoom(1);
});


// --------------------------------------------------
// ZOOM
// --------------------------------------------------

// Keeps the canvas point under (anchorX, anchorY) fixed on screen.
function setZoom(newZoom, anchorX, anchorY) {
    newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);

    if (newZoom === zoom) {
        return;
    }

    if (anchorX === undefined || anchorY === undefined) {
        const containerRect = canvasContainer.getBoundingClientRect();

        anchorX = containerRect.left + containerRect.width / 2;
        anchorY = containerRect.top + containerRect.height / 2;
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
    const availableHeight = window.innerHeight * 0.8 - FRAME_BORDER_TOTAL;

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

// Ctrl + wheel (also trackpad pinch) zooms around the cursor.
canvasContainer.addEventListener("wheel", e => {
    if (!e.ctrlKey && !e.metaKey) {
        return;
    }

    e.preventDefault();

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

    setZoom(zoom * factor, e.clientX, e.clientY);
}, { passive: false });


// --------------------------------------------------
// SHAPE SELECTION
// --------------------------------------------------

shapeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentShape = btn.dataset.shape;

        shapeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        polygonOptions.hidden = currentShape !== "polygon";
    });
});


// --------------------------------------------------
// MOUSE DRAWING
// --------------------------------------------------

canvas.addEventListener("mousedown", e => {
    if (e.button !== 0) {
        return;
    }

    const position = getCanvasCoordinates(e);

    if (!position.inside) {
        return;
    }

    if (!currentShape) {
        showMessage("Select a shape or the pencil first.", "info");
        return;
    }

    drawing = true;

    startX = position.x;
    startY = position.y;

    moved = false;
    currentFreePath = [];

    if (currentShape === "free") {
        currentFreeColor = colorPicker.value;
        currentFreeWidth = freeWidth;

        currentFreePath = [{ x: startX, y: startY }];
    }
});


// --------------------------------------------------
// FREE DRAWING MOVEMENT
// --------------------------------------------------

window.addEventListener("mousemove", e => {
    if (!drawing || currentShape !== "free") {
        return;
    }

    const position = getCanvasCoordinates(e);

    const x = position.x;
    const y = position.y;

    const previousPoint = currentFreePath[currentFreePath.length - 1];

    if (!previousPoint) {
        return;
    }

    // Avoid adding identical consecutive points.
    if (
        Math.abs(previousPoint.x - x) < 0.5 &&
        Math.abs(previousPoint.y - y) < 0.5
    ) {
        return;
    }

    moved = true;

    currentFreePath.push({ x, y });

    ctx.strokeStyle = currentFreeColor;
    ctx.lineWidth = currentFreeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(previousPoint.x, previousPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
});


// --------------------------------------------------
// FINISH DRAWING
// --------------------------------------------------

function finishDrawing(e) {
    if (!drawing) {
        return;
    }

    drawing = false;

    // Freehand drawing.
    if (currentShape === "free") {
        const position = getCanvasCoordinates(e);

        const lastPoint = currentFreePath[currentFreePath.length - 1];

        if (
            lastPoint &&
            (
                Math.abs(lastPoint.x - position.x) >= 0.5 ||
                Math.abs(lastPoint.y - position.y) >= 0.5
            )
        ) {
            currentFreePath.push({ x: position.x, y: position.y });
            moved = true;
        }

        if (moved && currentFreePath.length > 1) {
            pushObject({
                type: "free",
                id: nextObjectId++,
                path: currentFreePath.slice(),
                color: currentFreeColor,
                width: currentFreeWidth
            });
        } else {
            // A single click creates a dot.
            pushObject({
                type: "dot",
                id: nextObjectId++,
                x: startX,
                y: startY,
                size: currentFreeWidth,
                color: currentFreeColor,
                filled: fillShapes,
                lineWidth: currentFreeWidth
            });
        }

        currentFreePath = [];
        moved = false;

        return;
    }

    // Geometric shapes.
    switch (currentShape) {
        case "circle":
        case "square":
        case "triangle":
        case "star7":
            pushObject(createShapeObject(currentShape));
            break;

        case "polygon":
            pushObject(
                createShapeObject("polygon", { sides: getPolygonSides() })
            );
            break;
    }

    currentFreePath = [];
    moved = false;
}

// Releasing the mouse anywhere finishes the drawing.
window.addEventListener("mouseup", finishDrawing);


// --------------------------------------------------
// CREATE SHAPE OBJECT
// --------------------------------------------------

function createShapeObject(type, extraProperties = {}) {
    return {
        type,
        id: nextObjectId++,
        x: startX,
        y: startY,
        size: shapeSize,
        color: colorPicker.value,
        filled: fillShapes,
        lineWidth: freeWidth,
        ...extraProperties
    };
}


// --------------------------------------------------
// OBJECT MANAGEMENT
// --------------------------------------------------

function pushObject(obj) {
    objects.push(obj);

    // A new object clears the redo history.
    undoneObjects = [];

    rebuildObjectList();
    redrawAll();
}


// --------------------------------------------------
// DRAWING PATH HELPERS
// --------------------------------------------------

function drawTrianglePath(x, y, size) {
    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size / 2, y - size);

    ctx.closePath();
}

function drawStarPath(cx, cy, spikes, outerRadius, innerRadius) {
    ctx.beginPath();

    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(
            cx + Math.cos(rot) * outerRadius,
            cy + Math.sin(rot) * outerRadius
        );

        rot += step;

        ctx.lineTo(
            cx + Math.cos(rot) * innerRadius,
            cy + Math.sin(rot) * innerRadius
        );

        rot += step;
    }

    ctx.closePath();
}

function drawPolygonPath(cx, cy, radius, sides) {
    if (sides < 3) {
        return;
    }

    const angle = (2 * Math.PI) / sides;

    ctx.beginPath();

    for (let i = 0; i < sides; i++) {
        const x = cx + radius * Math.cos(i * angle);
        const y = cy + radius * Math.sin(i * angle);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.closePath();
}


// --------------------------------------------------
// REDRAW ALL OBJECTS
// --------------------------------------------------

function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const obj of objects) {
        const isHovered = obj.id === hoverId;

        if (isHovered) {
            ctx.save();

            ctx.shadowBlur = 40;
            ctx.shadowColor = obj.color || colorPicker.value;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = obj.color || colorPicker.value;
        ctx.strokeStyle = obj.color || colorPicker.value;
        ctx.lineWidth = obj.lineWidth || obj.width || freeWidth;

        switch (obj.type) {
            case "circle":
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);

                if (obj.filled) {
                    ctx.fill();
                }

                ctx.stroke();
                break;

            case "square":
                ctx.beginPath();
                ctx.rect(obj.x, obj.y, obj.size, obj.size);

                if (obj.filled) {
                    ctx.fill();
                }

                ctx.stroke();
                break;

            case "triangle":
                drawTrianglePath(obj.x, obj.y, obj.size);

                if (obj.filled) {
                    ctx.fill();
                }

                ctx.stroke();
                break;

            case "star7":
                drawStarPath(
                    obj.x,
                    obj.y,
                    7,
                    obj.size / 2,
                    obj.size / 4
                );

                if (obj.filled) {
                    ctx.fill();
                }

                ctx.stroke();
                break;

            case "polygon":
                drawPolygonPath(obj.x, obj.y, obj.size / 2, obj.sides);

                if (obj.filled) {
                    ctx.fill();
                }

                ctx.stroke();
                break;

            case "free":
                ctx.beginPath();

                for (let i = 0; i < obj.path.length; i++) {
                    const p = obj.path[i];

                    if (i === 0) {
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }

                ctx.lineWidth = obj.width || freeWidth;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();
                break;

            case "dot":
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);

                if (obj.filled) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }

                break;
        }

        if (isHovered) {
            ctx.restore();
        }
    }
}


// --------------------------------------------------
// OBJECT LIST
// --------------------------------------------------

function rebuildObjectList() {
    objectList.innerHTML = "";

    for (const obj of objects) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        const del = document.createElement("button");

        span.textContent = labelFor(obj);

        del.textContent = "🗑️";
        del.className = "del-btn";
        del.type = "button";

        li.appendChild(span);
        li.appendChild(del);

        li.dataset.id = obj.id;

        objectList.appendChild(li);

        li.addEventListener("mouseenter", () => {
            hoverId = obj.id;
            redrawAll();
            del.style.display = "block";
        });

        li.addEventListener("mouseleave", () => {
            hoverId = null;
            redrawAll();
            del.style.display = "none";
        });

        del.addEventListener("click", ev => {
            ev.stopPropagation();

            const idx = objects.findIndex(o => o.id === obj.id);

            if (idx !== -1) {
                const removed = objects.splice(idx, 1)[0];

                undoneObjects.push(removed);

                hoverId = null;

                rebuildObjectList();
                redrawAll();
            }
        });
    }
}


// --------------------------------------------------
// OBJECT LABELS
// --------------------------------------------------

function labelFor(obj) {
    const fillText = obj.filled ? "Filled" : "Hollow";

    switch (obj.type) {
        case "circle":
            return `Circle (${obj.color}, ${fillText})`;

        case "square":
            return `Square (${obj.color}, ${fillText})`;

        case "triangle":
            return `Triangle (${obj.color}, ${fillText})`;

        case "star7":
            return `7-pointed Star (${obj.color}, ${fillText})`;

        case "polygon":
            return `${obj.sides}-sided Polygon (${obj.color}, ${fillText})`;

        case "free":
            return `Free Drawing (${obj.color})`;

        case "dot":
            return `Free Dot (${obj.color}, ${fillText})`;

        default:
            return `Object (${obj.color || ""})`;
    }
}


// --------------------------------------------------
// UNDO / REDO / CLEAR
// --------------------------------------------------

undoBtn.addEventListener("click", () => {
    if (objects.length === 0) {
        return;
    }

    undoneObjects.push(objects.pop());

    hoverId = null;

    rebuildObjectList();
    redrawAll();
});

redoBtn.addEventListener("click", () => {
    if (undoneObjects.length === 0) {
        return;
    }

    objects.push(undoneObjects.pop());

    rebuildObjectList();
    redrawAll();
});

clearBtn.addEventListener("click", () => {
    objects = [];
    undoneObjects = [];

    hoverId = null;

    objectList.innerHTML = "";

    redrawAll();
});


// --------------------------------------------------
// SAVE DRAWING
// --------------------------------------------------

if (saveForm && drawingDataInput) {
    saveForm.addEventListener("submit", e => {
        // Client-side check only; the rest is handled by the backend.
        if (objects.length === 0) {
            e.preventDefault();
            showMessage(
                "The drawing is empty. Draw something before saving.",
                "warning"
            );
            return;
        }

        drawingDataInput.value = JSON.stringify(objects);
    });
}


// --------------------------------------------------
// INITIALIZATION
// --------------------------------------------------

// The browser may restore old input values on reload, so read them
// and validate them instead of trusting the HTML attributes.
setCanvasSize(
    parseSizeInput(canvasWidthInput, DEFAULT_CANVAS_WIDTH),
    parseSizeInput(canvasHeightInput, DEFAULT_CANVAS_HEIGHT)
);

// Optional message rendered by the backend (see the HTML).
if (appMessage && appMessage.dataset.initialMessage) {
    showMessage(
        appMessage.dataset.initialMessage,
        appMessage.dataset.initialType || "info"
    );
}