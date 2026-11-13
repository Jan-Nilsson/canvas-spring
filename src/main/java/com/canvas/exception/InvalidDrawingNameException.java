package com.canvas.exception;

public class InvalidDrawingNameException extends RuntimeException {

    public InvalidDrawingNameException() {
        super("Invalid drawing name");
    }
}