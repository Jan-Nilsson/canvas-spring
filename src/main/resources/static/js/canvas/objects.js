// Object/layer list and object deletion.

import { elements, state } from "./context.js";

export function createLayers(actions) {
    function getObjectLabel(object) {
        const fillText = object.filled ? "Filled" : "Hollow";

        switch (object.type) {
            case "circle":
                return `Circle · ${fillText}`;
            case "square":
                return `Square · ${fillText}`;
            case "triangle":
                return `Triangle · ${fillText}`;
            case "star7":
                return `${object.points || 7}-pointed star`;
            case "polygon":
                return `${object.sides}-sided polygon · ${fillText}`;
            case "pencil":
            case "free":
                return "Pencil stroke";
            case "eraser":
                return "Eraser stroke";
            case "fill":
                return "Bucket fill";
            case "dot":
                return "Pencil dot";
            default:
                return "Object";
        }
    }

    function renderObjectList() {
        elements.objectList.innerHTML = "";
        elements.objectCount.textContent = state.objects.length;
        elements.emptyObjectsHint.hidden = state.objects.length > 0;

        state.objects.forEach((object, index) => {
            const item = document.createElement("li");
            const selectButton = document.createElement("button");
            const deleteButton = document.createElement("button");

            item.className = "object-item";
            item.dataset.id = object.id;

            if (object.id === state.selectedObjectId) {
                item.classList.add("selected");
            }

            selectButton.type = "button";
            selectButton.className = "object-select-button";
            selectButton.textContent = `${index + 1}. ${getObjectLabel(object)}`;
            selectButton.addEventListener("click", () => actions.selectObject(object.id));

            deleteButton.type = "button";
            deleteButton.className = "del-btn";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete object";
            deleteButton.setAttribute("aria-label", "Delete object");
            deleteButton.addEventListener("click", event => {
                event.stopPropagation();
                deleteObject(object.id);
            });

            item.appendChild(selectButton);
            item.appendChild(deleteButton);

            item.addEventListener("mouseenter", () => {
                state.hoverObjectId = object.id;
                deleteButton.style.display = "inline-flex";
            });

            item.addEventListener("mouseleave", () => {
                state.hoverObjectId = null;
                deleteButton.style.display = "none";
            });

            elements.objectList.appendChild(item);
        });
    }

    function deleteObject(objectId) {
        const index = state.objects.findIndex(object => object.id === objectId);
        if (index === -1) {
            return;
        }

        state.objects.splice(index, 1);

        if (state.selectedObjectId === objectId) {
            state.selectedObjectId = null;
        }

        state.hoverObjectId = null;
        actions.recordHistory();
        renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
    }

    function pushObject(object) {
        state.objects.push(object);
        actions.recordHistory();
        renderObjectList();
        actions.renderSelectedObjectEditor();
        actions.redrawAll();
    }

    return {
        getObjectLabel,
        renderObjectList,
        deleteObject,
        pushObject
    };
}