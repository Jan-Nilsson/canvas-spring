
package com.canvas.exception;

public class UnauthenticatedException extends RuntimeException {

    public UnauthenticatedException() {
        super("User is not authenticated");
    }
}
