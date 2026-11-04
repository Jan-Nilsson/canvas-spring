const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const shapeButtons = document.querySelectorAll(".shape-btn");
const objectList = document.getElementById("objectList");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

const shapeSizeInput = document.getElementById("shapeSize");
const shapeSizeLabel = document.getElementById("shapeSizeLabel");
let shapeSize = parseInt(shapeSizeInput.value,10);

const freeWidthInput = document.getElementById("freeWidth");
const freeWidthLabel = document.getElementById("freeWidthLabel");
let freeWidth = parseInt(freeWidthInput.value,10);

const canvasWidthInput = document.getElementById("canvasWidth");
const canvasHeightInput = document.getElementById("canvasHeight");
const applyCanvasSizeBtn = document.getElementById("applyCanvasSize");

const fillToggle = document.getElementById("fillToggle");
const fillLabel = document.getElementById("fillLabel");
let fillShapes = fillToggle.checked;

let currentShape = null;
let drawing = false;
let startX = 0, startY = 0;
let objects = [];
let undoneObjects = [];
let moved = false;
let currentFreePath = [];
let nextObjectId = 1;
let hoverId = null;

canvas.width = parseInt(canvasWidthInput.value,10);
canvas.height = parseInt(canvasHeightInput.value,10);

shapeSizeInput.addEventListener("input", () => {
    shapeSize = parseInt(shapeSizeInput.value,10);
    shapeSizeLabel.textContent = shapeSize;
});

freeWidthInput.addEventListener("input", () => {
    freeWidth = parseInt(freeWidthInput.value,10);
    freeWidthLabel.textContent = freeWidth;
});

fillToggle.addEventListener("change", () => {
    fillShapes = fillToggle.checked;
    fillLabel.textContent = fillShapes ? "Filled" : "Hollow";
});

applyCanvasSizeBtn.addEventListener("click", () => {
    const w = parseInt(canvasWidthInput.value,10);
    const h = parseInt(canvasHeightInput.value,10);
    if (!isNaN(w) && !isNaN(h)) {
        canvas.width = w;
        canvas.height = h;
        redrawAll();
    }
});

shapeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentShape = btn.dataset.shape;
        shapeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

canvas.addEventListener("mousedown", e => {
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    if (currentShape === "free") {
        moved = false;
        currentFreePath = [{x: startX, y: startY}];
    }
});

canvas.addEventListener("mousemove", e => {
    if (!drawing) return;
    const x = e.offsetX;
    const y = e.offsetY;
    if (currentShape === "free") {
        moved = true;
        currentFreePath.push({x,y});
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = freeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        const p0 = currentFreePath[currentFreePath.length - 2];
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});

window.addEventListener("mouseup", () => {
    if (drawing && currentShape === "free") {
        drawing = false;
        finalizeFreeDrawing();
    } else {
        drawing = false;
    }
});

canvas.addEventListener("mouseup", e => {
    if (!drawing) return;
    drawing = false;

    ctx.strokeStyle = colorPicker.value;
    ctx.fillStyle = colorPicker.value;

    switch (currentShape) {
        case "circle":
            ctx.beginPath();
            ctx.arc(startX, startY, shapeSize/2, 0, Math.PI*2);
            ctx.lineWidth = freeWidth;
            if (fillShapes) ctx.fill();
            ctx.stroke();
            pushObject({type:"circle", id: nextObjectId++, x:startX, y:startY, size:shapeSize, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            break;
        case "square":
            ctx.beginPath();
            ctx.rect(startX, startY, shapeSize, shapeSize);
            ctx.lineWidth = freeWidth;
            if (fillShapes) ctx.fill();
            ctx.stroke();
            pushObject({type:"square", id: nextObjectId++, x:startX, y:startY, size:shapeSize, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            break;
        case "triangle":
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX+shapeSize, startY);
            ctx.lineTo(startX+shapeSize/2, startY-shapeSize);
            ctx.closePath();
            ctx.lineWidth = freeWidth;
            if (fillShapes) ctx.fill();
            ctx.stroke();
            pushObject({type:"triangle", id: nextObjectId++, x:startX, y:startY, size:shapeSize, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            break;
        case "star7":
            drawStarPath(startX, startY, 7, shapeSize/2, shapeSize/4);
            ctx.lineWidth = freeWidth;
            if (fillShapes) ctx.fill();
            ctx.stroke();
            pushObject({type:"star7", id: nextObjectId++, x:startX, y:startY, size:shapeSize, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            break;
        case "polygon":
            const points = parseInt(prompt("Number of points?"),10);
            if (!isNaN(points) && points >= 3) {
                drawPolygonPath(startX, startY, shapeSize/2, points);
                ctx.lineWidth = freeWidth;
                if (fillShapes) ctx.fill();
                ctx.stroke();
                pushObject({type:"polygon", id: nextObjectId++, x:startX, y:startY, size:shapeSize, sides:points, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            }
            break;
        case "free":
            if (moved) {
                pushObject({type:"free", id: nextObjectId++, path: currentFreePath.slice(), color: colorPicker.value, width: freeWidth});
                currentFreePath = [];
            } else {
                ctx.beginPath();
                ctx.arc(startX, startY, freeWidth/2, 0, Math.PI*2);
                ctx.lineWidth = freeWidth;
                if (fillShapes) ctx.fill();
                else ctx.stroke();
                pushObject({type:"dot", id: nextObjectId++, x:startX, y:startY, size:freeWidth, color:colorPicker.value, filled: fillShapes, lineWidth: freeWidth});
            }
            break;
    }
});

function pushObject(obj){
    objects.push(obj);
    undoneObjects = [];
    rebuildObjectList();
    redrawAll();
}

function drawStarPath(cx, cy, spikes, outerRadius, innerRadius) {
    ctx.beginPath();
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.closePath();
}

function drawPolygonPath(cx, cy, radius, sides) {
    if (sides < 3) return;
    const angle = (2*Math.PI)/sides;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const x = cx + radius * Math.cos(i * angle);
        const y = cy + radius * Math.sin(i * angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function finalizeFreeDrawing(){
    if (currentFreePath.length === 0) return;
    currentFreePath = [];
    moved = false;
    redrawAll();
}

function redrawAll(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const obj of objects) {
        if (obj.id === hoverId) {
            ctx.save();
            ctx.shadowBlur = 40;
            ctx.shadowColor = obj.color || colorPicker.value;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = obj.color || colorPicker.value;
        ctx.strokeStyle = obj.color || colorPicker.value;
        ctx.lineWidth = obj.lineWidth || freeWidth;

        switch (obj.type) {
            case "circle":
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI*2);
                if (obj.filled) ctx.fill();
                ctx.stroke();
                break;
            case "square":
                ctx.beginPath();
                ctx.rect(obj.x, obj.y, obj.size, obj.size);
                if (obj.filled) ctx.fill();
                ctx.stroke();
                break;
            case "triangle":
                ctx.beginPath();
                ctx.moveTo(obj.x, obj.y);
                ctx.lineTo(obj.x+obj.size, obj.y);
                ctx.lineTo(obj.x+obj.size/2, obj.y-obj.size);
                ctx.closePath();
                if (obj.filled) ctx.fill();
                ctx.stroke();
                break;
            case "star7":
                drawStarPath(obj.x, obj.y, 7, obj.size/2, obj.size/4);
                if (obj.filled) ctx.fill();
                ctx.stroke();
                break;
            case "polygon":
                drawPolygonPath(obj.x, obj.y, obj.size/2, obj.sides);
                if (obj.filled) ctx.fill();
                ctx.stroke();
                break;
            case "free":
                ctx.beginPath();
                for (let i = 0; i < obj.path.length; i++) {
                    const p = obj.path[i];
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.lineWidth = obj.width || freeWidth;
                ctx.lineCap = "round";
                ctx.stroke();
                break;
            case "dot":
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI*2);
                if (obj.filled) ctx.fill();
                else ctx.stroke();
                break;
        }
        if (obj.id === hoverId) ctx.restore();
    }
}

function rebuildObjectList(){
    objectList.innerHTML = "";
    for (const obj of objects) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        const del = document.createElement("button");
        span.textContent = labelFor(obj);
        del.textContent = "🗑️";
        del.className = "del-btn";
        li.appendChild(span);
        li.appendChild(del);
        li.dataset.id = obj.id;
        objectList.appendChild(li);
        li.addEventListener("mouseenter", () => {
            hoverId = obj.id;
            redrawAll();
            del.style.display = "block";
        });
        li.addEventListener("mouseleave", () => {
            hoverId = null;
            redrawAll();
            del.style.display = "none";
        });
        del.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const id = obj.id;
            const idx = objects.findIndex(o => o.id === id);
            if (idx !== -1) {
                const removed = objects.splice(idx,1)[0];
                undoneObjects.push(removed);
                rebuildObjectList();
                redrawAll();
            }
        });
    }
}

function labelFor(obj){
    const fillText = obj.filled ? "Filled" : "Hollow";
    switch(obj.type){
        case "circle": return `Circle (${obj.color}, ${fillText})`;
        case "square": return `Square (${obj.color}, ${fillText})`;
        case "triangle": return `Triangle (${obj.color}, ${fillText})`;
        case "star7": return `7-pointed Star (${obj.color}, ${fillText})`;
        case "polygon": return `${obj.sides}-sided Polygon (${obj.color}, ${fillText})`;
        case "free": return `Free Drawing (${obj.color})`;
        case "dot": return `Free Dot (${obj.color}, ${fillText})`;
        default: return `Object (${obj.color || ""})`;
    }
}

undoBtn.addEventListener("click", () => {
    if (objects.length === 0) return;
    const o = objects.pop();
    undoneObjects.push(o);
    rebuildObjectList();
    redrawAll();
});

redoBtn.addEventListener("click", () => {
    if (undoneObjects.length === 0) return;
    const o = undoneObjects.pop();
    objects.push(o);
    rebuildObjectList();
    redrawAll();
});

clearBtn.addEventListener("click", () => {
    objects = [];
    undoneObjects = [];
    objectList.innerHTML = "";
    redrawAll();
});

saveBtn.addEventListener("click", () => {
    let name = prompt("Enter a name for your drawing:");
    if (!name || name.trim() === "") {
        name = generateRandomName(8);
    }
    name = name.trim();

    const drawingData = {
        name: name,
        date: new Date().toISOString(),
        objects: objects.slice()
    };

    const formData = new FormData();
    formData.append("action", "add");
    formData.append("name", drawingData.name);
    formData.append("date", drawingData.date);
    formData.append("data", JSON.stringify(drawingData.objects));

    fetch(`${window.location.origin}${window.location.pathname}`, {
        method: "POST",
        body: formData
    })
        .then(res => {
            if (res.ok) {
                alert(`Drawing "${name}" saved successfully!`);
                objects = [];
                undoneObjects = [];
                rebuildObjectList();
                redrawAll();
            } else {
                alert("Error saving drawing");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error saving drawing");
        });
});



// Genera un string aleatorio de letras y números
function generateRandomName(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

