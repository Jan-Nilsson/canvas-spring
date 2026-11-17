// Undo/redo snapshots.

import { elements, state, cloneObjects } from "./context.js";

export function createHistory(actions) {
    let history = [];
    let historyIndex = -1;

    function updateButtons() {
        elements.undoButton.disabled = historyIndex <= 0;
        elements.redoButton.disabled = historyIndex >= history.length - 1;
    }

    function resetHistory() {
        history = [cloneObjects()];
        historyIndex = 0;
        updateButtons();
    }

    function recordHistory() {
        history = history.slice(0, historyIndex + 1);
        history.push(cloneObjects());
        historyIndex = history.length - 1;
        updateButtons();
        actions.scheduleDraftSave();
    }

    function restoreHistoryState() {
        state.objects = cloneObjects(history[historyIndex]);
        state.selectedObjectId = null;
        state.hoverObjectId = null;

        const maxId = state.objects.reduce(
            (max, object) => Math.max(max, Number(object.id) || 0),
            0
        );

        state.nextObjectId = Math.max(state.nextObjectId, maxId + 1);

        actions.renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
        updateButtons();
        actions.scheduleDraftSave();
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

    function wireHistory() {
        elements.undoButton.addEventListener("click", undo);
        elements.redoButton.addEventListener("click", redo);

        elements.clearButton.addEventListener("click", () => {
            if (state.objects.length === 0) {
                return;
            }

            state.objects = [];
            state.selectedObjectId = null;
            state.hoverObjectId = null;

            recordHistory();
            actions.renderObjectList();
            actions.renderSelectedObjectEditor();
            actions.redrawAll();
        });
    }

    return {
        resetHistory,
        recordHistory,
        undo,
        redo,
        wireHistory
    };
}