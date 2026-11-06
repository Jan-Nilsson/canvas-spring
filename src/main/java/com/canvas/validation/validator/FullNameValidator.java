
package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.FullNameRules;
import org.springframework.stereotype.Component;

@Component
public class FullNameValidator {

    public boolean hasValidLength(String fullName) {
        return fullName != null
                && fullName.trim().length() >= FullNameRules.MIN_LENGTH
                && fullName.trim().length() <= FullNameRules.MAX_LENGTH;
    }

    public boolean isValid(String fullName) {
        return hasValidLength(fullName);
    }
}
