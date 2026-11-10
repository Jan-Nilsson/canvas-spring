package com.canvas.validation.validator.rules.common;

import java.util.Locale;

public class TextNormalizer {
    public static String normalizeForModeration(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replace('1', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('5', 's')
                .replace('0', 'o')
                .replace('7', 't');
    }
}
