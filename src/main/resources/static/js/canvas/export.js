// Export the artwork as PNG without including editor selection outlines.

import { elements, state, showMessage } from "./context.js";

export function wirePngExport(actions) {
    elements.exportPngButton.addEventListener("click", () => {
        const previousSelection = state.selectedObjectId;

        state.selectedObjectId = null;
        actions.redrawAll();

        elements.canvas.toBlob(blob => {
            state.selectedObjectId = previousSelection;
            actions.redrawAll();

            if (!blob) {
                showMessage("Could not export the drawing as an image.", "warning");
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const baseName = elements.drawingNameInput && elements.drawingNameInput.value.trim()
                ? elements.drawingNameInput.value.trim()
                : "drawing";

            const safeName = baseName
                .replace(/[\\/:*?"<>|]+/g, "-")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "") || "drawing";

            link.href = url;
            link.download = `${safeName}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showMessage("PNG image downloaded.", "success");
        }, "image/png");
    });
}