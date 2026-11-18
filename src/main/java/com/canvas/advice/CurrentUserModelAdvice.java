package com.canvas.advice;

import com.canvas.dto.ProfileView;
import com.canvas.model.Profile;
import com.canvas.model.User;
import com.canvas.repository.ProfileRepository;
import com.canvas.repository.UserRepository;
import com.canvas.service.SessionService;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class CurrentUserModelAdvice {

    private final SessionService session;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public CurrentUserModelAdvice(
            SessionService session,
            UserRepository userRepository,
            ProfileRepository profileRepository) {

        this.session = session;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @ModelAttribute("currentUser")
    public ProfileView addCurrentUser() {

        Long userId = session.getCurrentUserId();

        if (userId == null) {
            return null;
        }

        User user = userRepository.findById(userId)
                .orElse(null);

        if (user == null) {
            return null;
        }

        Profile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        String displayName = user.getUsername();
        String bio = null;
        String profileImageUrl = null;

        if (profile != null) {

            bio = profile.getBio();
            profileImageUrl = profile.getProfileImageUrl();

            if (profile.isShowFullName()
                    && user.getFullName() != null
                    && !user.getFullName().isBlank()) {

                displayName = user.getFullName();

            } else if (profile.getDisplayName() != null
                    && !profile.getDisplayName().isBlank()) {

                displayName = profile.getDisplayName();
            }
        }

        return new ProfileView(
                user.getId(),
                user.getUsername(),
                displayName,
                bio,
                profileImageUrl
        );
    }
}