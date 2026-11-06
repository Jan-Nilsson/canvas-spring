
package com.canvas.validation.validator;

import com.canvas.validation.validator.rules.UsernameRules;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class UsernameValidator {

    public boolean hasValidLength(String username) {
        return username != null
                && username.length() >= UsernameRules.MIN_LENGTH
                && username.length() <= UsernameRules.MAX_LENGTH;
    }

    public boolean hasValidCharacters(String username) {
        return username != null
                && username.matches("^[a-zA-Z0-9_-]+$");
    }

    public boolean isValidFormat(String username) {
        return hasValidLength(username)
                && hasValidCharacters(username);
    }

    public boolean containsBannedWord(String username) {
        if (username == null) {
            return false;
        }

        String normalized = normalizeForModeration(username);

        return UsernameRules.BANNED_WORDS.stream()
                .anyMatch(normalized::contains);
    }

    public boolean isReserved(String username) {
        return username != null
                && UsernameRules.RESERVED_NAMES.contains(
                username.toLowerCase(Locale.ROOT)
        );
    }

    private String normalizeForModeration(String username) {
        return username.toLowerCase(Locale.ROOT)
                .replace('1', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('5', 's')
                .replace('0', 'o')
                .replace('7', 't');
    }

    public boolean isValid(String username) {
        return isValidFormat(username)
                && !containsBannedWord(username)
                && !isReserved(username);
    }
}
