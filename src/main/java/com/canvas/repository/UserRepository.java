package com.canvas.repository;

import com.canvas.model.User;

import java.util.Optional;

public interface UserRepository {
    User save(String fullName, String username, String password);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
