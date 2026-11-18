
package com.canvas.dto;

public class ProfileView {

    private final Long userId;
    private final String username;
    private final String displayName;
    private final String bio;
    private final String profileImageUrl;

    public ProfileView(
            Long userId,
            String username,
            String displayName,
            String bio,
            String profileImageUrl) {

        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }
}
