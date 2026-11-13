
package com.canvas.service;

import com.canvas.exception.InvalidUserRegistrationException;
import com.canvas.repository.UserRepository;
import com.canvas.validation.validator.UsernameValidator;
import com.canvas.validation.validator.FullNameValidator;
import com.canvas.validation.validator.PasswordValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UsernameValidator usernameValidator;
    private final FullNameValidator fullNameValidator;
    private final PasswordValidator passwordValidator;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            UsernameValidator usernameValidator,
            FullNameValidator fullNameValidator,
            PasswordValidator passwordValidator,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.usernameValidator = usernameValidator;
        this.fullNameValidator = fullNameValidator;
        this.passwordValidator = passwordValidator;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerUser(
            String fullName,
            String username,
            String password,
            String confirmPassword) {

        fullName = fullName == null ? null : fullName.trim();

        Map<String, String> errors = validateRegister(
                fullName, username, password, confirmPassword
        );

        if (!errors.isEmpty()) {
            throw new InvalidUserRegistrationException(errors);
        }

        String encodedPassword = passwordEncoder.encode(password);

        userRepository.save(fullName, username, encodedPassword);
    }

    private Map<String, String> validateRegister(
            String fullName,
            String username,
            String password,
            String confirmPassword) {

        Map<String, String> errors = new HashMap<>();

        if (!fullNameValidator.isValid(fullName)) {
            errors.put(
                    "invalidFullName",
                    "Full name must contain between 2 and 100 characters"
            );
        }

        if (!usernameValidator.isValid(username)) {
            errors.put(
                    "invalidUsername",
                    "Username format is invalid"
            );
        } else {

            if (usernameValidator.containsBannedWord(username)) {
                errors.put(
                        "bannedWordMessage",
                        "Username '" + username
                                + "' contains inappropriate language"
                );
            }

            if (usernameValidator.isReserved(username)) {
                errors.put(
                        "reservedUsernameMessage",
                        "Username '" + username
                                + "' is reserved for internal usage"
                );
            }

            if (userRepository.existsByUsername(username)) {
                errors.put(
                        "usernameAlreadyExists",
                        "Username '" + username + "' is already taken"
                );
            }
        }

        if (!passwordValidator.isValid(password)) {
            errors.put(
                    "invalidPassword",
                    "Password must contain at least 5 characters"
            );
        }

        if (!passwordValidator.passwordsMatch(password, confirmPassword)) {
            errors.put(
                    "passwordMismatch",
                    "Passwords do not match"
            );
        }

        return errors;
    }
}
