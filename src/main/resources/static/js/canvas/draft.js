// Unsaved drawing recovery in sessionStorage, plus server drawing normalization.

import {
    elements,
    config,
    state,
    clamp,
    cloneObjects,
    isValidColor,
    showMessage
} from "./context.js";

let draftTimer = null;
let serverDrawingSignature = "";
let storageWarningShown = false;

function getDraftStorageKey() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return config.DRAFT_STORAGE_PREFIX + encodeURIComponent(path);
}

function hashText(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index++) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return `${value.length}:${(hash >>> 0).toString(16)}`;
}

function pageWasReloaded() {
    try {
        const entries = performance.getEntriesByType("navigation");

        if (entries.length > 0) {
            return entries[0].type === "reload";
        }

        return Boolean(performance.navigation && performance.navigation.type === 1);
    } catch (error) {
        return false;
    }
}

function readDraft() {
    try {
        const raw = sessionStorage.getItem(getDraftStorageKey());
        if (!raw) {
            return null;
        }

        const draft = JSON.parse(raw);

        if (!draft || draft.version !== 1 || !Array.isArray(draft.objects)) {
            sessionStorage.removeItem(getDraftStorageKey());
            return null;
        }

        return draft;
    } catch (error) {
        return null;
    }
}

export function clearDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;

    try {
        sessionStorage.removeItem(getDraftStorageKey());
    } catch (error) {
        // Storage is optional; the server-side save remains authoritative.
    }
}

export function normalizeObjects(source, width = elements.canvas.width, height = elements.canvas.height) {
    if (!Array.isArray(source)) {
        return [];
    }

    const normalized = [];

    source.forEach((rawObject, index) => {
        if (!rawObject || typeof rawObject !== "object") {
            return;
        }

        const object = { ...rawObject };

        // Previous versions called pencil strokes "free".
        if (object.type === "free") {
            object.type = "pencil";
        }

        object.id = Number.isFinite(Number(object.id)) && Number(object.id) > 0
            ? Math.floor(Number(object.id))
            : index + 1;

        if (["circle", "square", "triangle", "star7", "polygon", "dot"].includes(object.type)) {
            object.x = Number.isFinite(Number(object.x)) ? Number(object.x) : 0;
            object.y = Number.isFinite(Number(object.y)) ? Number(object.y) : 0;
            object.size = clamp(
                Number.isFinite(Number(object.size)) ? Number(object.size) : 50,
                1,
                Math.max(width, height) * 2
            );
            object.color = isValidColor(object.color) ? object.color : "#202a3a";
            object.filled = Boolean(object.filled);
            object.lineWidth = clamp(
                Number.isFinite(Number(object.lineWidth)) ? Number(object.lineWidth) : 2,
                1,
                80
            );

            if (object.type === "polygon") {
                object.sides = clamp(
                    Math.round(Number(object.sides) || config.DEFAULT_POLYGON_SIDES),
                    config.MIN_POLYGON_SIDES,
                    config.MAX_POLYGON_SIDES
                );
            }

            if (object.type === "star7") {
                object.points = clamp(
                    Math.round(Number(object.points) || config.DEFAULT_STAR_POINTS),
                    config.MIN_STAR_POINTS,
                    config.MAX_STAR_POINTS
                );
            }
        } else if (object.type === "pencil" || object.type === "eraser") {
            object.path = Array.isArray(object.path)
                ? object.path
                    .filter(point =>
                        point &&
                        Number.isFinite(Number(point.x)) &&
                        Number.isFinite(Number(point.y))
                    )
                    .map(point => ({ x: Number(point.x), y: Number(point.y) }))
                : [];

            object.width = clamp(
                Number.isFinite(Number(object.width)) ? Number(object.width) : 2,
                1,
                80
            );

            if (object.type === "pencil") {
                object.color = isValidColor(object.color) ? object.color : "#202a3a";
            }
        } else if (object.type === "fill") {
            object.x = clamp(Math.floor(Number(object.x) || 0), 0, width - 1);
            object.y = clamp(Math.floor(Number(object.y) || 0), 0, height - 1);
            object.color = isValidColor(object.color) ? object.color : "#202a3a";

            const oldTolerance = Number(object.tolerance);
            object.tolerance = !Number.isFinite(oldTolerance) || oldTolerance <= 32
                ? config.FILL_TOLERANCE
                : clamp(oldTolerance, 0, 255);
        } else {
            return;
        }

        normalized.push(object);
    });

    return normalized;
}

function parseServerDrawing() {
    const raw = elements.drawingDataInput.value
        ? elements.drawingDataInput.value.trim()
        : "";

    serverDrawingSignature = hashText(raw);

    if (!raw) {
        return [];
    }

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
        return normalizeObjects(parsed);
    }

    if (parsed && Array.isArray(parsed.objects)) {
        return normalizeObjects(parsed.objects);
    }

    throw new Error("The saved drawing data has an invalid format.");
}

export function scheduleDraftSave() {
    if (!state.workspaceInitialized) {
        return;
    }

    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, config.DRAFT_SAVE_DELAY);
}

export function saveDraftNow() {
    if (!state.workspaceInitialized) {
        return;
    }

    clearTimeout(draftTimer);
    draftTimer = null;

    const draft = {
        version: 1,
        sourceDrawingSignature: serverDrawingSignature,
        drawingName: elements.drawingNameInput ? elements.drawingNameInput.value : "",
        canvasWidth: elements.canvas.width,
        canvasHeight: elements.canvas.height,
        objects: cloneObjects()
    };

    try {
        sessionStorage.setItem(getDraftStorageKey(), JSON.stringify(draft));
    } catch (error) {
        if (!storageWarningShown) {
            storageWarningShown = true;
            showMessage(
                "The browser could not keep a recovery draft. Save the drawing to avoid losing it.",
                "warning"
            );
        }
    }
}

export function loadInitialWorkspace() {
    const successMessage = elements.appMessage.dataset.initialType === "success";

    if (successMessage) {
        clearDraft();
    }

    let serverObjects = [];

    try {
        serverObjects = parseServerDrawing();
    } catch (error) {
        showMessage(
            "The saved drawing could not be read. A recovery draft may still be available.",
            "warning"
        );
    }

    let draft = null;

    if (pageWasReloaded() && !successMessage) {
        draft = readDraft();
    } else {
        clearDraft();
    }

    const draftMatchesServer = draft && draft.sourceDrawingSignature === serverDrawingSignature;

    let width = Number(elements.canvasWidthInput.value) || config.DEFAULT_CANVAS_WIDTH;
    let height = Number(elements.canvasHeightInput.value) || config.DEFAULT_CANVAS_HEIGHT;

    if (draftMatchesServer) {
        const draftWidth = Number(draft.canvasWidth);
        const draftHeight = Number(draft.canvasHeight);

        if (Number.isFinite(draftWidth) && draftWidth >= config.MIN_CANVAS_SIZE && draftWidth <= config.MAX_CANVAS_SIZE) {
            width = draftWidth;
        }

        if (Number.isFinite(draftHeight) && draftHeight >= config.MIN_CANVAS_SIZE && draftHeight <= config.MAX_CANVAS_SIZE) {
            height = draftHeight;
        }

        state.objects = normalizeObjects(draft.objects, width, height);

        if (elements.drawingNameInput && draft.drawingName !== undefined) {
            elements.drawingNameInput.value = draft.drawingName;
        }
    } else {
        state.objects = normalizeObjects(serverObjects, width, height);

        if (draft) {
            clearDraft();
        }
    }

    const maxId = state.objects.reduce(
        (max, object) => Math.max(max, Number(object.id) || 0),
        0
    );

    state.nextObjectId = maxId + 1;

    return { width, height };
}