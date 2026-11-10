package com.canvas.exception;

public class DrawingAccessDeniedException extends RuntimeException {

    public DrawingAccessDeniedException() {
        super("You cannot modify this drawing");
    }
}