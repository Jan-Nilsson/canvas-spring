// Geometric paths and shape construction.

import { context, elements, config, state, clamp } from "./context.js";

export function getPolygonSides() {
    const raw = elements.polygonSidesInput.value.trim();
    const value = Math.round(Number(raw));

    if (raw === "" || !Number.isFinite(value)) {
        return config.DEFAULT_POLYGON_SIDES;
    }

    return clamp(value, config.MIN_POLYGON_SIDES, config.MAX_POLYGON_SIDES);
}

export function getStarPoints() {
    const raw = elements.starPointsInput.value.trim();
    const value = Math.round(Number(raw));

    if (raw === "" || !Number.isFinite(value)) {
        return config.DEFAULT_STAR_POINTS;
    }

    return clamp(value, config.MIN_STAR_POINTS, config.MAX_STAR_POINTS);
}

export function buildTrianglePath(object) {
    const radius = object.size / 2;

    context.beginPath();
    context.moveTo(object.x, object.y - radius);
    context.lineTo(object.x + radius, object.y + radius);
    context.lineTo(object.x - radius, object.y + radius);
    context.closePath();
}

export function buildStarPath(cx, cy, spikes, outerRadius, innerRadius) {
    context.beginPath();

    for (let index = 0; index < spikes * 2; index++) {
        const angle = -Math.PI / 2 + (index * Math.PI) / spikes;
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (index === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }

    context.closePath();
}

export function buildPolygonPath(cx, cy, radius, sides) {
    const safeSides = Math.max(3, sides || config.DEFAULT_POLYGON_SIDES);

    context.beginPath();

    for (let index = 0; index < safeSides; index++) {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / safeSides;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (index === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }

    context.closePath();
}

export function buildShapePath(object) {
    switch (object.type) {
        case "circle":
            context.beginPath();
            context.arc(object.x, object.y, object.size / 2, 0, Math.PI * 2);
            break;

        case "square": {
            const half = object.size / 2;
            context.beginPath();
            context.rect(object.x - half, object.y - half, object.size, object.size);
            break;
        }

        case "triangle":
            buildTrianglePath(object);
            break;

        case "star7":
            buildStarPath(
                object.x,
                object.y,
                object.points || config.DEFAULT_STAR_POINTS,
                object.size / 2,
                object.size / 4
            );
            break;

        case "polygon":
            buildPolygonPath(object.x, object.y, object.size / 2, object.sides);
            break;

        case "dot":
            context.beginPath();
            context.arc(object.x, object.y, object.size / 2, 0, Math.PI * 2);
            break;

        default:
            context.beginPath();
    }
}

export function buildStrokePath(path) {
    context.beginPath();

    if (!Array.isArray(path) || path.length === 0) {
        return;
    }

    context.moveTo(path[0].x, path[0].y);

    for (let index = 1; index < path.length; index++) {
        context.lineTo(path[index].x, path[index].y);
    }
}

export function getPreviewShapeSize() {
    const distance = Math.hypot(
        state.pointerX - state.startX,
        state.pointerY - state.startY
    );

    if (distance < config.DRAG_THRESHOLD) {
        return state.shapeSize;
    }

    return clamp(
        distance * 2,
        10,
        Math.max(elements.canvas.width, elements.canvas.height) * 2
    );
}

export function createShapeObject(type, x, y, size, extraProperties = {}) {
    return {
        type,
        id: state.nextObjectId++,
        x,
        y,
        size,
        color: elements.colorPicker.value,
        filled: state.fillShapes,
        lineWidth: state.pencilWidth,
        ...extraProperties
    };
}