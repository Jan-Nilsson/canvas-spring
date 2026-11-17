// Canvas Studio entry point. Feature logic lives in ./canvas/ modules.

import { elements, state, showMessage } from "./canvas/context.js";

import { readPreferences, savePreferences } from "./canvas/preferences.js";
import { loadInitialWorkspace, scheduleDraftSave, saveDraftNow } from "./canvas/draft.js";

import { redrawAll } from "./canvas/renderer.js";
import { createHistory } from "./canvas/history.js";
import { createLayers } from "./canvas/objects.js";
import { createProperties } from "./canvas/properties.js";
import { createTools } from "./canvas/tools.js";
import { createViewport } from "./canvas/viewport.js";
import { createInteractions } from "./canvas/interactions.js";
import { wirePngExport } from "./canvas/export.js";

// Show unexpected runtime errors inside the editor instead of failing silently.
window.addEventListener("error", event => {
    const box = document.createElement("div");
    box.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:9999;" +
        "background:#c0392b;color:#fff;padding:8px;font:14px monospace";

    box.textContent =
        `JS error: ${event.message} ` +
        `(${(event.filename || "").split("/").pop()}:${event.lineno})`;

    document.body.appendChild(box);
});

// Modules receive this shared action registry. It avoids circular imports:
// modules declare their dependencies here, and the entry point wires them up.
const actions = {
    redrawAll,
    scheduleDraftSave
};

const layers = createLayers(actions);
Object.assign(actions, layers);

const properties = createProperties(actions);
Object.assign(actions, properties);

const history = createHistory(actions);
Object.assign(actions, history);

const tools = createTools(actions);
Object.assign(actions, tools);

actions.savePreferences = () => savePreferences(
    tools.getPolygonSides,
    tools.getStarPoints
);

const viewport = createViewport(actions);
Object.assign(actions, viewport);

const interactions = createInteractions(actions);
Object.assign(actions, interactions);


// ==================================================
// FORM AND KEYBOARD EVENTS
// ==================================================

function wireSaveForm() {
    elements.saveForm.addEventListener("submit", event => {
        if (state.objects.length === 0) {
            event.preventDefault();
            showMessage(
                "The drawing is empty. Draw something before saving.",
                "warning"
            );
            return;
        }

        elements.drawingDataInput.value = JSON.stringify(state.objects);

        if (elements.savedWidthInput) {
            elements.savedWidthInput.value = elements.canvas.width;
        }

        if (elements.savedHeightInput) {
            elements.savedHeightInput.value = elements.canvas.height;
        }

        // Keep a last local snapshot until the server confirms the save.
        // A successful server response clears it during initialization.
        saveDraftNow();
    });

    if (elements.drawingNameInput) {
        elements.drawingNameInput.addEventListener("input", scheduleDraftSave);
    }
}

function wireKeyboardShortcuts() {
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
            event.shiftKey ? actions.redo() : actions.undo();
        } else if (key === "y") {
            event.preventDefault();
            actions.redo();
        }
    });
}

function wireDraftLifecycle() {
    window.addEventListener("pagehide", saveDraftNow);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            saveDraftNow();
        }
    });
}


// ==================================================
// INITIALIZATION
// ==================================================

readPreferences();

const initialWorkspace = loadInitialWorkspace();

// Restore canvas dimensions before drawing the loaded objects.
viewport.setCanvasSize(initialWorkspace.width, initialWorkspace.height);

// Restore and wire the controls only after every module has been registered.
tools.wireTools();
tools.wirePanels();
viewport.wireViewport();
history.wireHistory();
interactions.wireInteractions();
wirePngExport(actions);
wireSaveForm();
wireKeyboardShortcuts();
wireDraftLifecycle();

tools.updateToolControls();
actions.renderObjectList();
actions.renderSelectedObjectEditor();
history.resetHistory();

state.workspaceInitialized = true;

if (elements.appMessage.dataset.initialMessage) {
    showMessage(
        elements.appMessage.dataset.initialMessage,
        elements.appMessage.dataset.initialType || "info"
    );
}