package com.canvas.model;

import java.util.List;

public class CanvasData {

    private List<CanvasObject> objects;
    private int canvasWidth;
    private int canvasHeight;

    public CanvasData(
            List<CanvasObject> objects,
            int canvasWidth,
            int canvasHeight) {

        this.objects = objects;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    public List<CanvasObject> getObjects() {
        return objects;
    }

    public int getCanvasWidth() {
        return canvasWidth;
    }

    public int getCanvasHeight() {
        return canvasHeight;
    }
}