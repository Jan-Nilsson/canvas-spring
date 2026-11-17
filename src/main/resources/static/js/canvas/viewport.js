// Canvas dimensions, zoom and viewport controls.

import { elements, config, state, clamp, showMessage } from "./context.js";

export function createViewport(actions) {
    function updateDisplaySize() {
        elements.canvas.style.width = `${elements.canvas.width * state.zoom}px`;
        elements.canvas.style.height = `${elements.canvas.height * state.zoom}px`;
        elements.canvas.style.maxWidth = "none";
        elements.canvas.style.maxHeight = "none";
        elements.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    function setCanvasSize(width, height) {
        elements.canvas.width = width;
        elements.canvas.height = height;
        elements.canvasWidthInput.value = width;
        elements.canvasHeightInput.value = height;
        updateDisplaySize();
        actions.redrawAll();
        actions.scheduleDraftSave();
    }

    function parseSizeInput(input, fallback) {
        const raw = input.value.trim();
        const value = Math.round(Number(raw));

        if (raw === "" || !Number.isFinite(value)) {
            return fallback;
        }

        return clamp(value, config.MIN_CANVAS_SIZE, config.MAX_CANVAS_SIZE);
    }

    function commitCanvasSize() {
        const rawWidth = elements.canvasWidthInput.value.trim();
        const rawHeight = elements.canvasHeightInput.value.trim();

        const width = parseSizeInput(elements.canvasWidthInput, elements.canvas.width);
        const height = parseSizeInput(elements.canvasHeightInput, elements.canvas.height);

        const corrected = rawWidth !== String(width) || rawHeight !== String(height);

        if (width !== elements.canvas.width || height !== elements.canvas.height) {
            setCanvasSize(width, height);
        } else {
            elements.canvasWidthInput.value = width;
            elements.canvasHeightInput.value = height;
        }

        if (corrected) {
            showMessage(
                `Canvas size must be between ${config.MIN_CANVAS_SIZE} and ${config.MAX_CANVAS_SIZE} px.`,
                "warning"
            );
        }
    }

    function setZoom(newZoom, anchorX, anchorY) {
        newZoom = clamp(newZoom, config.MIN_ZOOM, config.MAX_ZOOM);

        if (newZoom === state.zoom) {
            return;
        }

        if (anchorX === undefined || anchorY === undefined) {
            const rect = elements.canvasContainer.getBoundingClientRect();
            anchorX = rect.left + rect.width / 2;
            anchorY = rect.top + rect.height / 2;
        }

        const before = elements.canvas.getBoundingClientRect();
        const canvasX = (anchorX - before.left) / state.zoom;
        const canvasY = (anchorY - before.top) / state.zoom;

        state.zoom = newZoom;
        updateDisplaySize();
        actions.savePreferences();

        const after = elements.canvas.getBoundingClientRect();
        elements.canvasContainer.scrollLeft += after.left + canvasX * state.zoom - anchorX;
        elements.canvasContainer.scrollTop += after.top + canvasY * state.zoom - anchorY;
    }

    function fitToView() {
        const availableWidth = Math.max(1, elements.canvasContainer.clientWidth - config.FRAME_BORDER_TOTAL);
        const availableHeight = Math.max(1, elements.canvasContainer.clientHeight - config.FRAME_BORDER_TOTAL);
        const fit = Math.min(1, availableWidth / elements.canvas.width, availableHeight / elements.canvas.height);

        setZoom(fit);
        elements.canvasContainer.scrollTo(0, 0);
    }

    function wireViewport() {
        [elements.canvasWidthInput, elements.canvasHeightInput].forEach(input => {
            input.addEventListener("change", commitCanvasSize);
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    commitCanvasSize();
                }
            });
        });

        elements.resetCanvasSizeButton.addEventListener("click", () => {
            setCanvasSize(config.DEFAULT_CANVAS_WIDTH, config.DEFAULT_CANVAS_HEIGHT);
            setZoom(1);
        });

        elements.zoomInButton.addEventListener("click", () => setZoom(state.zoom * config.ZOOM_STEP));
        elements.zoomOutButton.addEventListener("click", () => setZoom(state.zoom / config.ZOOM_STEP));
        elements.zoomResetButton.addEventListener("click", () => setZoom(1));
        elements.zoomFitButton.addEventListener("click", fitToView);

        elements.canvasContainer.addEventListener("wheel", event => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            event.preventDefault();
            const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
            setZoom(state.zoom * factor, event.clientX, event.clientY);
        }, { passive: false });
    }

    return {
        updateDisplaySize,
        setCanvasSize,
        setZoom,
        fitToView,
        wireViewport
    };
}