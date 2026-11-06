package com.canvas.service;

import com.canvas.model.User;
import com.canvas.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<Long> checkLogin(String username, String password) {

        Optional<User> user = userRepository.findByUsername(username);

        if (user.isPresent()
                && passwordEncoder.matches(password, user.get().getPassword())) {
            return Optional.of(user.get().getId());
        }

        return Optional.empty();
    }
}