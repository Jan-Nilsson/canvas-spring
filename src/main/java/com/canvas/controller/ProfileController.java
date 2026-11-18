package com.canvas.controller;

import com.canvas.dto.ProfileView;
import com.canvas.model.Drawing;
import com.canvas.service.ProfileImageStorageService;
import com.canvas.service.ProfileService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Controller
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/u/{username}")
    public String showProfile(
            @PathVariable String username,
            Model model) {

        ProfileView profile =
                profileService.findPublicProfile(username);

        Long userId = profile.getUserId();

        boolean isOwnProfile =
                profileService.isOwnProfile(userId);

        List<Drawing> drawings =
                profileService.findPublicDrawings(userId);

        model.addAttribute("profile", profile);
        model.addAttribute("isOwnProfile", isOwnProfile);
        model.addAttribute("drawings", drawings);

        return "profile";
    }

    @GetMapping("/profile/edit")
    public String showEditProfile(Model model) {

        model.addAttribute(
                "profile",
                profileService.getCurrentProfileForEdit()
        );

        model.addAttribute(
                "username",
                profileService.getCurrentUsername()
        );

        return "profile-edit";
    }

    @PostMapping("/profile/edit")
    public String updateProfile(
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String bio,
            @RequestParam(defaultValue = "false") boolean showFullName,
            @RequestParam(required = false) MultipartFile profileImage,
            Model model,
            RedirectAttributes redirectAttributes) {

        try {

            profileService.updateCurrentProfile(
                    displayName,
                    bio,
                    showFullName,
                    profileImage
            );

            redirectAttributes.addFlashAttribute(
                    "profileSuccess",
                    "Your profile has been updated successfully."
            );

            return "redirect:/profile/edit";

        } catch (IllegalArgumentException exception) {

            return showEditProfileWithError(
                    model,
                    displayName,
                    bio,
                    showFullName,
                    exception.getMessage()
            );

        } catch (IOException exception) {

            return showEditProfileWithError(
                    model,
                    displayName,
                    bio,
                    showFullName,
                    "The profile picture could not be read. Please try again."
            );
        }
    }

    @GetMapping("/profile/image/{userId}")
    public ResponseEntity<byte[]> getProfileImage(
            @PathVariable Long userId) {

        Optional<ProfileImageStorageService.StoredProfileImage> image =
                profileService.findProfileImage(userId);

        if (image.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ProfileImageStorageService.StoredProfileImage storedImage =
                image.get();

        return ResponseEntity.ok()
                .contentType(storedImage.getMediaType())
                .cacheControl(CacheControl.noCache())
                .body(storedImage.getContent());
    }

    private String showEditProfileWithError(
            Model model,
            String displayName,
            String bio,
            boolean showFullName,
            String errorMessage) {

        model.addAttribute(
                "profile",
                profileService.getCurrentProfileForEdit()
        );

        model.addAttribute(
                "username",
                profileService.getCurrentUsername()
        );

        model.addAttribute("submittedDisplayName", displayName);
        model.addAttribute("submittedBio", bio);
        model.addAttribute("submittedShowFullName", showFullName);
        model.addAttribute("profileError", errorMessage);

        return "profile-edit";
    }
}