
package com.canvas.repository;

import com.canvas.model.Profile;

import java.util.Optional;

public interface ProfileRepository {

    Optional<Profile> findByUserId(Long userId);

    Profile save(Profile profile);

    void deleteByUserId(Long userId);
}
