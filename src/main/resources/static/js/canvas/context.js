// Shared DOM references, configuration and editor state.

function requireElement(id) {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Canvas Studio: missing HTML element #${id}`);
    }

    return element;
}

export const elements = {
    canvas: requireElement("drawingCanvas"),
    canvasContainer: requireElement("canvasContainer"),
    colorPicker: requireElement("colorPicker"),
    objectList: requireElement("objectList"),

    undoButton: requireElement("undoBtn"),
    redoButton: requireElement("redoBtn"),
    clearButton: requireElement("clearBtn"),
    exportPngButton: requireElement("exportPngBtn"),

    saveForm: requireElement("saveForm"),
    drawingDataInput: requireElement("drawingData"),
    savedWidthInput: document.getElementById("savedCanvasWidth"),
    savedHeightInput: document.getElementById("savedCanvasHeight"),
    drawingNameInput: document.getElementById("drawingName"),

    shapeSizeInput: requireElement("shapeSize"),
    shapeSizeLabel: requireElement("shapeSizeLabel"),
    strokeWidthInput: requireElement("freeWidth"),
    strokeWidthLabel: requireElement("freeWidthLabel"),
    strokeWidthTitle: requireElement("freeWidthTitle"),

    polygonOptions: requireElement("polygonOptions"),
    polygonSidesInput: requireElement("polygonSides"),
    starOptions: requireElement("starOptions"),
    starPointsInput: requireElement("starPoints"),

    canvasWidthInput: requireElement("canvasWidth"),
    canvasHeightInput: requireElement("canvasHeight"),
    resetCanvasSizeButton: requireElement("resetCanvasSize"),

    zoomOutButton: requireElement("zoomOutBtn"),
    zoomInButton: requireElement("zoomInBtn"),
    zoomResetButton: requireElement("zoomResetBtn"),
    zoomFitButton: requireElement("zoomFitBtn"),
    zoomLabel: requireElement("zoomLabel"),

    fillToggle: requireElement("fillToggle"),
    fillLabel: requireElement("fillLabel"),
    colorControls: requireElement("colorControls"),
    fillControls: requireElement("fillControls"),
    shapeSizeControls: requireElement("shapeSizeControls"),
    strokeWidthControls: requireElement("freeWidthControls"),

    appMessage: requireElement("appMessage"),
    toolsPanel: requireElement("toolsPanel"),
    objectsPanel: requireElement("objectsPanel"),
    toggleToolsPanelButton: requireElement("toggleToolsPanel"),
    toggleObjectsPanelButton: requireElement("toggleObjectsPanel"),

    objectCount: requireElement("objectCount"),
    emptyObjectsHint: requireElement("emptyObjectsHint"),
    selectedObjectEditor: requireElement("selectedObjectEditor"),
    selectedObjectTitle: requireElement("selectedObjectTitle"),
    selectedObjectFields: requireElement("selectedObjectFields"),
    clearSelectionButton: requireElement("clearSelectionBtn"),

    shapeButtons: document.querySelectorAll(".shape-btn")
};

export const context = elements.canvas.getContext("2d");

if (!context) {
    throw new Error("Canvas Studio: this browser does not support a 2D canvas context.");
}

export const config = {
    DEFAULT_CANVAS_WIDTH: 800,
    DEFAULT_CANVAS_HEIGHT: 600,
    MIN_CANVAS_SIZE: 100,
    MAX_CANVAS_SIZE: 4000,

    MIN_ZOOM: 0.1,
    MAX_ZOOM: 4,
    ZOOM_STEP: 1.25,

    DEFAULT_POLYGON_SIDES: 5,
    MIN_POLYGON_SIDES: 3,
    MAX_POLYGON_SIDES: 50,

    DEFAULT_STAR_POINTS: 7,
    MIN_STAR_POINTS: 4,
    MAX_STAR_POINTS: 20,

    FRAME_BORDER_TOTAL: 2,
    CANVAS_BACKGROUND_COLOR: "#ffffff",
    HIT_TOLERANCE: 8,
    DRAG_THRESHOLD: 3,

    FILL_TOLERANCE: 72,

    PREFERENCES_STORAGE_KEY: "canvas.studio.preferences.v1",
    DRAFT_STORAGE_PREFIX: "canvas.studio.draft.v1:",
    DRAFT_SAVE_DELAY: 300
};

export const validTools = new Set([
    "select",
    "pencil",
    "eraser",
    "bucket",
    "circle",
    "square",
    "triangle",
    "star7",
    "polygon"
]);

export const geometricTools = new Set([
    "circle",
    "square",
    "triangle",
    "star7",
    "polygon"
]);

export const state = {
    shapeSize: Number(elements.shapeSizeInput.value) || 50,
    pencilWidth: Number(elements.strokeWidthInput.value) || 2,
    eraserWidth: 20,
    fillShapes: elements.fillToggle.checked,

    currentTool: "select",

    isDrawing: false,
    isDraggingObject: false,
    dragState: null,
    activePointerId: null,

    startX: 0,
    startY: 0,
    pointerX: 0,
    pointerY: 0,

    objects: [],
    nextObjectId: 1,

    currentStrokePath: [],
    currentStrokeColor: "#202a3a",
    currentStrokeWidth: 2,

    selectedObjectId: null,
    hoverObjectId: null,

    zoom: 1,
    workspaceInitialized: false
};

let messageTimer = null;

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function cloneObjects(source = state.objects) {
    return JSON.parse(JSON.stringify(source));
}

export function getObjectById(id) {
    return state.objects.find(object => object.id === id) || null;
}

export function isGeometricObject(object) {
    return geometricTools.has(object.type);
}

export function isValidColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function showMessage(message, type = "info") {
    elements.appMessage.textContent = message;
    elements.appMessage.className = `app-message ${type}`;
    elements.appMessage.hidden = false;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        elements.appMessage.hidden = true;
    }, 4000);
}

export function getCanvasCoordinates(event) {
    const rect = elements.canvas.getBoundingClientRect();

    const rawX = ((event.clientX - rect.left) / Math.max(rect.width, 1))
        * elements.canvas.width;

    const rawY = ((event.clientY - rect.top) / Math.max(rect.height, 1))
        * elements.canvas.height;

    const inside = (
        rawX >= 0 &&
        rawX <= elements.canvas.width &&
        rawY >= 0 &&
        rawY <= elements.canvas.height
    );

    return {
        x: clamp(rawX, 0, elements.canvas.width),
        y: clamp(rawY, 0, elements.canvas.height),
        inside
    };
}