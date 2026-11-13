
package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.DrawingNameRules;
import com.canvas.validation.validator.rules.common.BannedWords;
import com.canvas.validation.validator.rules.common.InternationalNamePattern;
import com.canvas.validation.validator.rules.common.TextNormalizer;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class DrawingNameValidator {

    public boolean hasValidLength(String drawingName) {
        return drawingName != null
                && drawingName.trim().length() >= DrawingNameRules.MIN_LENGTH
                && drawingName.trim().length() <= DrawingNameRules.MAX_LENGTH;
    }

    public boolean hasValidCharacters(String drawingName) {
        return Objects.nonNull(drawingName)
                && InternationalNamePattern.INTERNATIONAL_PATTERN
                .matcher(drawingName)
                .matches();
    }

    public boolean containsBannedWord(String drawingName) {
        if (drawingName == null) {
            return false;
        }

        String normalized = TextNormalizer.normalizeForModeration(drawingName);

        return BannedWords.WORDS.stream()
                .anyMatch(normalized::contains);
    }

    public boolean isValid(String drawingName) {
        return hasValidLength(drawingName)
                && hasValidCharacters(drawingName)
                && !containsBannedWord(drawingName);
    }
}
