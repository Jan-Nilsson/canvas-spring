
package com.canvas.service;

import com.canvas.model.User;
import com.canvas.repository.UserRepository;
import com.canvas.validation.validator.UsernameValidator;
import com.canvas.validation.validator.FullNameValidator;
import com.canvas.validation.validator.PasswordValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

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

    public Optional<Long> registerUser(
            String fullName,
            String username,
            String password,
            String confirmPassword) {

        fullName = fullName == null ? null : fullName.trim();

        if (!validateRegister(fullName, username, password, confirmPassword)) {
            return Optional.empty();
        }

        String encodedPassword = passwordEncoder.encode(password);

        User user = userRepository.save(fullName, username, encodedPassword);

        return Optional.of(user.getId());
    }

    public boolean checkUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean passwordsMatch(
            String password,
            String confirmPassword) {

        return passwordValidator.passwordsMatch(password, confirmPassword);
    }

    public boolean isValidUsername(String username) {
        return usernameValidator.isValid(username);
    }

    public boolean isValidFullName(String fullName) {
        return fullNameValidator.isValid(fullName);
    }

    public boolean isValidPassword(String password) {
        return passwordValidator.isValid(password);
    }

    public boolean containsBannedWord(String username) {
        return usernameValidator.containsBannedWord(username);
    }

    public boolean isReserved(String username) {
        return usernameValidator.isReserved(username);
    }

    public boolean validateRegister(
            String fullName,
            String username,
            String password,
            String confirmPassword) {

        return isValidFullName(fullName)
                && !checkUsername(username)
                && isValidUsername(username)
                && isValidPassword(password)
                && passwordsMatch(password, confirmPassword);
    }
}
