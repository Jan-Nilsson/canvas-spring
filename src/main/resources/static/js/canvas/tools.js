
// Tool selection, contextual controls and workspace panels.

import {
    elements,
    config,
    state,
    clamp,
    validTools,
    geometricTools,
    showMessage
} from "./context.js";

import { setToolCursor } from "./cursors.js";

export function createTools(actions) {

    // ==================================================
    // TOOL SETTINGS
    // ==================================================

    function getPolygonSides() {
        const raw = elements.polygonSidesInput.value.trim();
        const value = Math.round(Number(raw));

        if (raw === "" || !Number.isFinite(value)) {
            return config.DEFAULT_POLYGON_SIDES;
        }

        return clamp(
            value,
            config.MIN_POLYGON_SIDES,
            config.MAX_POLYGON_SIDES
        );
    }

    function getStarPoints() {
        const raw = elements.starPointsInput.value.trim();
        const value = Math.round(Number(raw));

        if (raw === "" || !Number.isFinite(value)) {
            return config.DEFAULT_STAR_POINTS;
        }

        return clamp(
            value,
            config.MIN_STAR_POINTS,
            config.MAX_STAR_POINTS
        );
    }

    function updateToolControls() {
        const isShape = geometricTools.has(state.currentTool);
        const isPencil = state.currentTool === "pencil";
        const isEraser = state.currentTool === "eraser";
        const isBucket = state.currentTool === "bucket";

        elements.shapeSizeControls.hidden = !isShape;
        elements.strokeWidthControls.hidden = !(isPencil || isEraser);
        elements.fillControls.hidden = !isShape;
        elements.colorControls.hidden = !(isShape || isPencil || isBucket);
        elements.polygonOptions.hidden = state.currentTool !== "polygon";
        elements.starOptions.hidden = state.currentTool !== "star7";

        elements.strokeWidthTitle.textContent =
            isEraser ? "Eraser size" : "Stroke width";

        elements.strokeWidthInput.max = isEraser ? "80" : "40";
        elements.strokeWidthInput.value =
            isEraser ? state.eraserWidth : state.pencilWidth;

        elements.strokeWidthLabel.textContent =
            elements.strokeWidthInput.value;

        elements.shapeButtons.forEach(button => {
            const selected = button.dataset.shape === state.currentTool;

            button.classList.toggle("active", selected);
            button.setAttribute("aria-pressed", String(selected));
        });

        elements.canvas.classList.toggle(
            "select-tool",
            state.currentTool === "select"
        );

        elements.canvas.classList.toggle(
            "drawing-tool",
            state.currentTool !== "select"
        );

        setToolCursor(elements.canvas, state.currentTool);
    }

    function setCurrentTool(tool) {
        if (!validTools.has(tool)) {
            return;
        }

        state.currentTool = tool;

        if (tool !== "select") {
            state.selectedObjectId = null;
            actions.renderSelectedObjectEditor();
        }

        updateToolControls();
        actions.renderObjectList();
        actions.redrawAll();
        actions.savePreferences();
    }

    // ==================================================
    // PANEL CONFIGURATION
    // ==================================================

    const workspace = document.querySelector(".workspace");

    const MIN_PANEL_WIDTH = 220;
    const MAX_PANEL_WIDTH = 420;
    const MIN_CANVAS_WIDTH = 280;
    const RESIZE_HANDLE_WIDTH = 8;

    const panelConfigs = [
        {
            panel: elements.toolsPanel,
            button: elements.toggleToolsPanelButton,
            handle: document.getElementById("toolsResizeHandle"),
            side: "left",
            cssVariable: "--tools-panel-width",
            widthStorageKey: "canvas.toolsPanel.width",
            defaultWidth: 286
        },
        {
            panel: elements.objectsPanel,
            button: elements.toggleObjectsPanelButton,
            handle: document.getElementById("objectsResizeHandle"),
            side: "right",
            cssVariable: "--objects-panel-width",
            widthStorageKey: "canvas.objectsPanel.width",
            defaultWidth: 310
        }
    ];

    panelConfigs[0].other = panelConfigs[1];
    panelConfigs[1].other = panelConfigs[0];

    function isMobileLayout() {
        return window.matchMedia("(max-width: 820px)").matches;
    }

    function getPanelWidth(panelConfig) {
        if (!workspace) {
            return panelConfig.defaultWidth;
        }

        const value = getComputedStyle(workspace)
            .getPropertyValue(panelConfig.cssVariable)
            .trim();

        const parsed = Number.parseFloat(value);

        return Number.isFinite(parsed)
            ? parsed
            : panelConfig.defaultWidth;
    }

    function getMaximumPanelWidth(panelConfig) {
        if (!workspace || isMobileLayout()) {
            return MAX_PANEL_WIDTH;
        }

        const other = panelConfig.other;

        const otherWidth = other.panel.hidden
            ? 0
            : getPanelWidth(other);

        const visibleHandleCount = other.panel.hidden ? 1 : 2;

        const availableWidth =
            workspace.clientWidth
            - MIN_CANVAS_WIDTH
            - visibleHandleCount * RESIZE_HANDLE_WIDTH
            - otherWidth;

        return Math.max(
            MIN_PANEL_WIDTH,
            Math.min(MAX_PANEL_WIDTH, availableWidth)
        );
    }

    function setPanelWidth(panelConfig, requestedWidth, persist = false) {
        if (!workspace) {
            return panelConfig.defaultWidth;
        }

        const maximum = getMaximumPanelWidth(panelConfig);

        const width = clamp(
            Math.round(requestedWidth),
            MIN_PANEL_WIDTH,
            maximum
        );

        workspace.style.setProperty(
            panelConfig.cssVariable,
            `${width}px`
        );

        if (panelConfig.handle) {
            panelConfig.handle.setAttribute(
                "aria-valuenow",
                String(width)
            );

            panelConfig.handle.setAttribute(
                "aria-valuetext",
                `${width} pixels`
            );
        }

        if (persist) {
            try {
                localStorage.setItem(
                    panelConfig.widthStorageKey,
                    String(width)
                );
            } catch (error) {
                // Resizing still works if browser storage is unavailable.
            }
        }

        return width;
    }

    function restorePanelWidth(panelConfig) {
        let width = panelConfig.defaultWidth;

        try {
            const stored = localStorage.getItem(
                panelConfig.widthStorageKey
            );

            if (stored !== null) {
                const parsed = Number(stored);

                if (Number.isFinite(parsed)) {
                    width = parsed;
                }
            }
        } catch (error) {
            // Use the default width if local storage is unavailable.
        }

        setPanelWidth(panelConfig, width, false);
    }

    // ==================================================
    // PANEL VISIBILITY
    // ==================================================

    function setPanelVisibility(
        panelConfig,
        visible,
        persist = true
    ) {
        panelConfig.panel.hidden = !visible;

        if (panelConfig.handle) {
            panelConfig.handle.hidden = !visible;
        }

        panelConfig.button.setAttribute(
            "aria-expanded",
            String(visible)
        );

        const panelName = panelConfig.side === "left"
            ? "Tools"
            : "Objects";

        panelConfig.button.setAttribute(
            "aria-label",
            `${visible ? "Hide" : "Show"} ${panelName} panel`
        );

        panelConfig.button.title = visible
            ? `Hide ${panelName} panel`
            : `Show ${panelName} panel`;

        panelConfig.button.classList.toggle("active", visible);

        if (persist) {
            try {
                localStorage.setItem(
                    `canvas.${panelConfig.panel.id}.visible`,
                    String(visible)
                );
            } catch (error) {
                // Visibility still works if browser storage is unavailable.
            }
        }
    }

    function restorePanelVisibility(panelConfig) {
        let visible = true;

        try {
            const stored = localStorage.getItem(
                `canvas.${panelConfig.panel.id}.visible`
            );

            if (stored === "false") {
                visible = false;
            }
        } catch (error) {
            // Panels are visible by default if storage is unavailable.
        }

        setPanelVisibility(panelConfig, visible, false);
    }

    // ==================================================
    // PANEL RESIZING
    // ==================================================

    function wirePanelResize(panelConfig) {
        const handle = panelConfig.handle;

        if (!handle || !workspace) {
            return;
        }

        let dragState = null;

        function finishResize(event) {
            if (dragState === null) {
                return;
            }

            if (
                event &&
                event.pointerId !== undefined &&
                event.pointerId !== dragState.pointerId
            ) {
                return;
            }

            setPanelWidth(
                panelConfig,
                getPanelWidth(panelConfig),
                true
            );

            dragState = null;
            document.body.classList.remove("panel-resizing");
        }

        handle.addEventListener("pointerdown", event => {
            if (!event.isPrimary) {
                return;
            }

            if (
                event.pointerType === "mouse" &&
                event.button !== 0
            ) {
                return;
            }

            if (panelConfig.panel.hidden || isMobileLayout()) {
                return;
            }

            event.preventDefault();

            dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startWidth: getPanelWidth(panelConfig)
            };

            document.body.classList.add("panel-resizing");

            try {
                handle.setPointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture is best-effort.
            }
        });

        handle.addEventListener("pointermove", event => {
            if (
                dragState === null ||
                event.pointerId !== dragState.pointerId
            ) {
                return;
            }

            const delta = event.clientX - dragState.startX;

            // Moving the left divider right enlarges Tools.
            // Moving the right divider left enlarges Objects.
            const direction = panelConfig.side === "left" ? 1 : -1;

            const nextWidth =
                dragState.startWidth + delta * direction;

            setPanelWidth(panelConfig, nextWidth, false);
        });

        handle.addEventListener("pointerup", finishResize);
        handle.addEventListener("pointercancel", finishResize);
        handle.addEventListener("lostpointercapture", finishResize);

        // Keyboard resizing for accessibility.
        handle.addEventListener("keydown", event => {
            const currentWidth = getPanelWidth(panelConfig);
            const maximum = getMaximumPanelWidth(panelConfig);
            const step = event.shiftKey ? 30 : 10;

            let nextWidth = currentWidth;

            switch (event.key) {
                case "ArrowLeft":
                case "ArrowDown":
                    nextWidth -= step;
                    break;

                case "ArrowRight":
                case "ArrowUp":
                    nextWidth += step;
                    break;

                case "Home":
                    nextWidth = MIN_PANEL_WIDTH;
                    break;

                case "End":
                    nextWidth = maximum;
                    break;

                default:
                    return;
            }

            event.preventDefault();
            setPanelWidth(panelConfig, nextWidth, true);
        });
    }

    function wirePanels() {
        // Restore saved widths first.
        panelConfigs.forEach(restorePanelWidth);

        panelConfigs.forEach(panelConfig => {
            panelConfig.button.addEventListener("click", () => {
                setPanelVisibility(
                    panelConfig,
                    panelConfig.panel.hidden
                );

                // Recalculate the remaining panel's available width.
                panelConfigs.forEach(otherConfig => {
                    if (!otherConfig.panel.hidden) {
                        setPanelWidth(
                            otherConfig,
                            getPanelWidth(otherConfig),
                            false
                        );
                    }
                });
            });

            restorePanelVisibility(panelConfig);
            wirePanelResize(panelConfig);
        });

        // Keep widths within the available workspace after resizing.
        window.addEventListener("resize", () => {
            if (isMobileLayout()) {
                return;
            }

            panelConfigs.forEach(panelConfig => {
                if (!panelConfig.panel.hidden) {
                    setPanelWidth(
                        panelConfig,
                        getPanelWidth(panelConfig),
                        false
                    );
                }
            });
        });
    }

    // ==================================================
    // TOOL EVENT LISTENERS
    // ==================================================

    function wireTools() {
        elements.shapeButtons.forEach(button => {
            button.addEventListener("click", () => {
                setCurrentTool(button.dataset.shape);
            });
        });

        elements.shapeSizeInput.addEventListener("input", () => {
            state.shapeSize = Number(elements.shapeSizeInput.value);
            elements.shapeSizeLabel.textContent = state.shapeSize;
            actions.savePreferences();
        });

        elements.strokeWidthInput.addEventListener("input", () => {
            const value = Number(elements.strokeWidthInput.value);

            if (state.currentTool === "eraser") {
                state.eraserWidth = value;
            } else {
                state.pencilWidth = value;
            }

            elements.strokeWidthLabel.textContent = value;
            actions.savePreferences();
        });

        elements.fillToggle.addEventListener("change", () => {
            state.fillShapes = elements.fillToggle.checked;

            elements.fillLabel.textContent =
                state.fillShapes ? "Filled" : "Hollow";

            actions.savePreferences();
        });

        elements.colorPicker.addEventListener(
            "input",
            actions.savePreferences
        );

        elements.polygonSidesInput.addEventListener("change", () => {
            const original = elements.polygonSidesInput.value.trim();
            const sides = getPolygonSides();

            elements.polygonSidesInput.value = sides;

            if (original !== String(sides)) {
                showMessage(
                    `Polygon sides must be between ${config.MIN_POLYGON_SIDES} and ${config.MAX_POLYGON_SIDES}.`,
                    "warning"
                );
            }

            actions.savePreferences();
        });

        elements.starPointsInput.addEventListener("change", () => {
            const original = elements.starPointsInput.value.trim();
            const points = getStarPoints();

            elements.starPointsInput.value = points;

            if (original !== String(points)) {
                showMessage(
                    `Star points must be between ${config.MIN_STAR_POINTS} and ${config.MAX_STAR_POINTS}.`,
                    "warning"
                );
            }

            actions.savePreferences();
        });
    }

    return {
        getPolygonSides,
        getStarPoints,
        updateToolControls,
        setCurrentTool,
        wireTools,
        wirePanels
    };
}
