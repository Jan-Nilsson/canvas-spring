// Small SVG cursors matching the selected drawing tools.

const cursorDefinitions = {
    pencil: {
        hotX: 5,
        hotY: 27,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 26 8 18 21 5 27 11 14 24Z" fill="#f6c453" stroke="#17243a" stroke-width="1.8" stroke-linejoin="round"/><path d="m5 26 3-8 6 6Z" fill="#fff" stroke="#17243a" stroke-width="1.4" stroke-linejoin="round"/><path d="m18 8 6 6" fill="none" stroke="#17243a" stroke-width="1.5"/><path d="m5 26 8-2" fill="none" stroke="#17243a" stroke-width="1.6"/></svg>`
    },
    eraser: {
        hotX: 8,
        hotY: 24,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="m7 18 10-11a3 3 0 0 1 4.3 0L28 13l-12 13H9l-5-5Z" fill="#f4a7b9" stroke="#17243a" stroke-width="1.8" stroke-linejoin="round"/><path d="m10 15 10 10M16 26h13" fill="none" stroke="#17243a" stroke-width="1.8" stroke-linecap="round"/></svg>`
    },
    bucket: {
        hotX: 23,
        hotY: 29,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="m6 13 9-9 11 11-9 9L6 13Z" fill="#a9c8f3" stroke="#17243a" stroke-width="1.8" stroke-linejoin="round"/><path d="m10 9 11 11M5 14l12 12" fill="none" stroke="#17243a" stroke-width="1.7" stroke-linecap="round"/><path d="M23 21c-2 2-3 4-3 5a3 3 0 0 0 6 0c0-1-1-3-3-5Z" fill="#4d91e8" stroke="#17243a" stroke-width="1.3"/></svg>`
    }
};

function toCursorUrl(svg) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function setToolCursor(canvas, tool) {
    const definition = cursorDefinitions[tool];

    if (!definition) {
        canvas.style.cursor = tool === "select" ? "default" : "crosshair";
        return;
    }

    canvas.style.cursor = `${toCursorUrl(definition.svg)} ${definition.hotX} ${definition.hotY}, crosshair`;
}

export function setSelectionCursor(canvas, cursor) {
    canvas.style.cursor = cursor === "grab" || cursor === "grabbing"
        ? cursor
        : "default";
}