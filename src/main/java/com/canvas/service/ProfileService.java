package com.canvas.service;

import com.canvas.dto.ProfileView;
import com.canvas.exception.UnauthenticatedException;
import com.canvas.exception.UserNotFoundException;
import com.canvas.model.Drawing;
import com.canvas.model.Profile;
import com.canvas.model.User;
import com.canvas.repository.DrawingRepository;
import com.canvas.repository.ProfileRepository;
import com.canvas.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final DrawingRepository drawingRepository;
    private final SessionService session;
    private final ProfileImageStorageService profileImageStorageService;

    public ProfileService(
            ProfileRepository profileRepository,
            UserRepository userRepository,
            DrawingRepository drawingRepository,
            SessionService session,
            ProfileImageStorageService profileImageStorageService) {

        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.drawingRepository = drawingRepository;
        this.session = session;
        this.profileImageStorageService = profileImageStorageService;
    }

    public ProfileView findPublicProfile(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(UserNotFoundException::new);

        Profile profile = findOrCreateProfile(user);

        String publicDisplayName = resolveDisplayName(user, profile);

        return new ProfileView(
                user.getId(),
                user.getUsername(),
                publicDisplayName,
                profile.getBio(),
                profile.getProfileImageUrl()
        );
    }

    public Profile getCurrentProfileForEdit() {

        User user = getAuthenticatedUser();

        return findOrCreateProfile(user);
    }

    public String getCurrentUsername() {

        return getAuthenticatedUser().getUsername();
    }

    public List<Drawing> findPublicDrawings(Long userId) {

        return drawingRepository.findAll().stream()
                .filter(drawing -> userId.equals(drawing.getAuthorId()))
                .filter(Drawing::isVisible)
                .toList();
    }

    public boolean isOwnProfile(Long profileUserId) {

        if (profileUserId == null) {
            return false;
        }

        Long currentUserId = session.getCurrentUserId();

        return currentUserId != null
                && currentUserId.equals(profileUserId);
    }

    public Profile updateCurrentProfile(
            String displayName,
            String bio,
            boolean showFullName) {

        User user = getAuthenticatedUser();

        Profile profile = findOrCreateProfile(user);

        displayName = normalize(displayName);
        bio = normalize(bio);

        validateProfile(displayName, bio);

        profile.setDisplayName(displayName);
        profile.setBio(bio);
        profile.setShowFullName(showFullName);

        return profileRepository.save(profile);
    }

    public Profile updateCurrentProfile(
            String displayName,
            String bio,
            boolean showFullName,
            MultipartFile profileImage) throws IOException {

        User user = getAuthenticatedUser();

        Profile profile = findOrCreateProfile(user);

        displayName = normalize(displayName);
        bio = normalize(bio);

        validateProfile(displayName, bio);

        String newImageUrl = null;

        if (profileImage != null && !profileImage.isEmpty()) {

            newImageUrl = profileImageStorageService.store(
                    user.getId(),
                    profileImage
            );
        }

        profile.setDisplayName(displayName);
        profile.setBio(bio);
        profile.setShowFullName(showFullName);

        if (newImageUrl != null) {
            profile.setProfileImageUrl(newImageUrl);
        }

        return profileRepository.save(profile);
    }

    public Profile updateCurrentProfileImage(String profileImageUrl) {

        User user = getAuthenticatedUser();

        Profile profile = findOrCreateProfile(user);

        profileImageUrl = normalize(profileImageUrl);

        if (profileImageUrl == null) {
            throw new IllegalArgumentException(
                    "Profile image path cannot be empty"
            );
        }

        profile.setProfileImageUrl(profileImageUrl);

        return profileRepository.save(profile);
    }

    public Optional<ProfileImageStorageService.StoredProfileImage>
    findProfileImage(Long userId) {

        return profileImageStorageService.findByUserId(userId);
    }

    private User getAuthenticatedUser() {

        Long userId = session.getCurrentUserId();

        if (userId == null) {
            throw new UnauthenticatedException();
        }

        return userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);
    }

    private Profile findOrCreateProfile(User user) {

        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {

                    Profile profile = new Profile(
                            user.getId(),
                            null,
                            null,
                            null,
                            false
                    );

                    return profileRepository.save(profile);
                });
    }

    private String resolveDisplayName(User user, Profile profile) {

        if (profile.isShowFullName()
                && user.getFullName() != null
                && !user.getFullName().isBlank()) {

            return user.getFullName();
        }

        if (profile.getDisplayName() != null
                && !profile.getDisplayName().isBlank()) {

            return profile.getDisplayName();
        }

        return user.getUsername();
    }

    private String normalize(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private void validateProfile(
            String displayName,
            String bio) {

        if (displayName != null && displayName.length() > 100) {
            throw new IllegalArgumentException(
                    "Display name cannot exceed 100 characters"
            );
        }

        if (bio != null && bio.length() > 500) {
            throw new IllegalArgumentException(
                    "Biography cannot exceed 500 characters"
            );
        }
    }
}