package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.common.BannedWords;
import com.canvas.validation.validator.rules.common.InternationalNamePattern;
import com.canvas.validation.validator.rules.common.TextNormalizer;

import java.util.Objects;

public class DrawingNameValidator {

    public boolean hasValidCharacters(String username) {
        return Objects.nonNull(username)
                && InternationalNamePattern.INTERNATIONAL_PATTERN.matcher(username).matches();
    }

    public boolean containsBannedWord(String drawingName) {
        if (drawingName == null) {
            return false;
        }

        String normalized = TextNormalizer.normalizeForModeration(drawingName);

        return BannedWords.WORDS.stream()
                .anyMatch(normalized::contains);
    }

}
