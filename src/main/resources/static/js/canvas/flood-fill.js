// Scanline flood fill. A tolerance of 72 absorbs most anti-aliased edge pixels
// while preserving the dark outline, usually leaving about one pixel of margin.

import { elements, context, config } from "./context.js";

function hexToRgba(hex) {
    const normalized = String(hex || "#000000").replace("#", "");
    const full = normalized.length === 3
        ? normalized.split("").map(character => character + character).join("")
        : normalized;

    return [
        parseInt(full.slice(0, 2), 16) || 0,
        parseInt(full.slice(2, 4), 16) || 0,
        parseInt(full.slice(4, 6), 16) || 0,
        255
    ];
}

function colorDistanceAt(data, pixelIndex, target) {
    return Math.max(
        Math.abs(data[pixelIndex] - target[0]),
        Math.abs(data[pixelIndex + 1] - target[1]),
        Math.abs(data[pixelIndex + 2] - target[2])
    );
}

export function floodFillAt(x, y, fillColor, tolerance = config.FILL_TOLERANCE) {
    const canvas = elements.canvas;
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    if (
        startX < 0 || startX >= canvas.width ||
        startY < 0 || startY >= canvas.height
    ) {
        return;
    }

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    const width = canvas.width;
    const height = canvas.height;
    const startIndex = (startY * width + startX) * 4;

    const target = [
        pixels[startIndex],
        pixels[startIndex + 1],
        pixels[startIndex + 2],
        pixels[startIndex + 3]
    ];

    const replacement = hexToRgba(fillColor);
    const safeTolerance = Math.max(0, Math.min(255, Number(tolerance) || config.FILL_TOLERANCE));

    // Do nothing when the clicked region is already effectively this colour.
    if (
        colorDistanceAt(pixels, startIndex, replacement) <= 1 &&
        Math.abs(target[3] - replacement[3]) <= 1
    ) {
        return;
    }

    // Mark processed pixels separately. This also prevents a near-identical
    // replacement colour from being mistaken for an unfilled target pixel.
    const visited = new Uint8Array(width * height);

    function matches(pixelIndex) {
        const pixel = pixelIndex >> 2;

        return (
            visited[pixel] === 0 &&
            colorDistanceAt(pixels, pixelIndex, target) <= safeTolerance &&
            Math.abs(pixels[pixelIndex + 3] - target[3]) <= safeTolerance
        );
    }

    // Scanline flood fill prevents recursion overflow on large canvases.
    const stack = [startY * width + startX];

    while (stack.length > 0) {
        const seed = stack.pop();
        const row = Math.floor(seed / width);
        let column = seed % width;
        let index = (row * width + column) * 4;

        if (!matches(index)) {
            continue;
        }

        // Move to the leftmost pixel in this contiguous span.
        while (column > 0 && matches(index - 4)) {
            column--;
            index -= 4;
        }

        let spanAbove = false;
        let spanBelow = false;

        while (column < width && matches(index)) {
            visited[index >> 2] = 1;
            pixels[index] = replacement[0];
            pixels[index + 1] = replacement[1];
            pixels[index + 2] = replacement[2];
            pixels[index + 3] = replacement[3];

            if (row > 0) {
                const above = index - width * 4;

                if (matches(above)) {
                    if (!spanAbove) {
                        stack.push((row - 1) * width + column);
                        spanAbove = true;
                    }
                } else {
                    spanAbove = false;
                }
            }

            if (row < height - 1) {
                const below = index + width * 4;

                if (matches(below)) {
                    if (!spanBelow) {
                        stack.push((row + 1) * width + column);
                        spanBelow = true;
                    }
                } else {
                    spanBelow = false;
                }
            }

            column++;
            index += 4;
        }
    }

    context.putImageData(image, 0, 0);
}