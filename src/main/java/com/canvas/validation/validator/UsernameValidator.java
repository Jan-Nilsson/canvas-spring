
package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.UsernameRules;
import com.canvas.validation.validator.rules.common.BannedWords;
import com.canvas.validation.validator.rules.common.InternationalNamePattern;
import com.canvas.validation.validator.rules.common.TextNormalizer;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Objects;

@Component
public class UsernameValidator {

    public boolean hasValidLength(String username) {
        return Objects.nonNull(username)
                && username.length() >= UsernameRules.MIN_LENGTH
                && username.length() <= UsernameRules.MAX_LENGTH;
    }

    public boolean hasValidCharacters(String username) {
        return Objects.nonNull(username)
                && InternationalNamePattern.INTERNATIONAL_PATTERN.matcher(username).matches();
    }

    public boolean isValidFormat(String username) {
        return hasValidLength(username)
                && hasValidCharacters(username);
    }

    public boolean containsBannedWord(String username) {
        if (username == null) {
            return false;
        }

        String normalized = TextNormalizer.normalizeForModeration(username);

        return BannedWords.WORDS.stream()
                .anyMatch(normalized::contains);
    }

    public boolean isReserved(String username) {
        return username != null
                && UsernameRules.RESERVED_NAMES.contains(
                username.toLowerCase(Locale.ROOT)
        );
    }

    public boolean isValid(String username) {
        return isValidFormat(username)
                && !containsBannedWord(username)
                && !isReserved(username);
    }
}
