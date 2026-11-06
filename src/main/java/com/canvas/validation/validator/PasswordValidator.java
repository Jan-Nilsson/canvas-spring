package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.PasswordRules;
import org.springframework.stereotype.Component;

@Component
public class PasswordValidator {

    public boolean hasValidLength(String password) {
        return password != null
                && password.length() >= PasswordRules.MIN_LENGTH;
    }

    public boolean passwordsMatch(String password, String confirmPassword) {
        return password != null
                && password.equals(confirmPassword);
    }

    public boolean isValid(String password) {
        return hasValidLength(password);
    }
}
