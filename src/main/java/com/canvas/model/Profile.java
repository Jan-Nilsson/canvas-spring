
package com.canvas.model;

public class Profile {

    private final Long userId;

    private String displayName;
    private String bio;
    private String profileImageUrl;
    private boolean showFullName;

    public Profile(
            Long userId,
            String displayName,
            String bio,
            String profileImageUrl,
            boolean showFullName) {

        this.userId = userId;
        this.displayName = displayName;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.showFullName = showFullName;
    }

    public Long getUserId() {
        return userId;
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

    public boolean isShowFullName() {
        return showFullName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setShowFullName(boolean showFullName) {
        this.showFullName = showFullName;
    }
}
