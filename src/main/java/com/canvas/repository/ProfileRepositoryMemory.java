package com.canvas.repository;

import com.canvas.model.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class ProfileRepositoryMemory implements ProfileRepository {

    private final ConcurrentMap<Long, Profile> profiles =
            new ConcurrentHashMap<>();

    @Override
    public Optional<Profile> findByUserId(Long userId) {

        if (userId == null) {
            return Optional.empty();
        }

        return Optional.ofNullable(profiles.get(userId));
    }

    @Override
    public Profile save(Profile profile) {

        if (profile == null || profile.getUserId() == null) {
            throw new IllegalArgumentException(
                    "Profile and user ID cannot be null"
            );
        }

        profiles.put(profile.getUserId(), profile);

        return profile;
    }

    @Override
    public void deleteByUserId(Long userId) {

        if (userId != null) {
            profiles.remove(userId);
        }
    }
}
