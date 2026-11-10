package com.canvas.validation.validator.rules.common;

import java.util.regex.Pattern;

public class InternationalNamePattern {
    public static final Pattern INTERNATIONAL_PATTERN =
            Pattern.compile("^[\\p{L}\\p{N}_-]{3,20}$");
}
