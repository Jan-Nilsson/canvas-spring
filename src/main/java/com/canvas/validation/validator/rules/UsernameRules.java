package com.canvas.validation.validator.rules;

import java.util.Set;
import java.util.regex.Pattern;

public final class UsernameRules {

    private UsernameRules() {}

    public static final int MIN_LENGTH = 3;
    public static final int MAX_LENGTH = 20;

    public static final Set<String> RESERVED_NAMES = Set.of(
            "admin",
            "administrator",
            "moderator",
            "support",
            "system"
    );
}