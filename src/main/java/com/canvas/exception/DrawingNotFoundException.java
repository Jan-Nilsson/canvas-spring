package com.canvas.exception;

public class DrawingNotFoundException extends RuntimeException {

    public DrawingNotFoundException() {
        super("Drawing not found");
    }
}