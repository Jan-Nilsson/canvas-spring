
package com.canvas.exception;

import java.util.Map;

public class InvalidUserRegistrationException extends RuntimeException {

    private final Map<String, String> errors;

    public InvalidUserRegistrationException(Map<String, String> errors) {
        super("Invalid user registration data");
        this.errors = Map.copyOf(errors);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
