"use strict";

// ==================================================
// ELEMENTS
// ==================================================

const editProfileForm = document.getElementById("editProfileForm");

const profileImageInput = document.getElementById("profileImage");
const profileImagePreview = document.getElementById("profileImagePreview");
const profileImageFallback = document.getElementById("profileImageFallback");

const removeProfileImageButton =
    document.getElementById("removeProfileImageButton");

const removeProfileImageInput =
    document.getElementById("removeProfileImage");

const profileImageError =
    document.getElementById("profileImageError");

const profileImageName =
    document.getElementById("profileImageName");

const bioInput = document.getElementById("bio");
const bioCharacterCount = document.getElementById("bioCharacterCount");


// ==================================================
// CONSTANTS
// ==================================================

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp"
]);

let previewObjectUrl = null;


// ==================================================
// IMAGE ERROR
// ==================================================

function showProfileImageError(message) {
    if (!profileImageError) {
        return;
    }

    profileImageError.textContent = message;
    profileImageError.hidden = message === "";
}


// ==================================================
// IMAGE PREVIEW
// ==================================================

function showProfileImageFallback() {
    const preview = document.getElementById("profileImagePreview");

    if (preview) {
        preview.remove();
    }

    if (profileImageFallback) {
        profileImageFallback.hidden = false;
    }
}

function revokePreviewUrl() {
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}


// ==================================================
// BIO CHARACTER COUNT
// ==================================================

function updateBioCharacterCount() {
    if (bioInput && bioCharacterCount) {
        bioCharacterCount.textContent = bioInput.value.length;
    }
}

if (bioInput) {
    bioInput.addEventListener("input", updateBioCharacterCount);
    updateBioCharacterCount();
}


// ==================================================
// IMAGE SELECTION
// ==================================================

if (profileImageInput) {

    profileImageInput.addEventListener("change", () => {

        showProfileImageError("");

        const file = profileImageInput.files[0];

        if (!file) {
            return;
        }

        if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
            profileImageInput.value = "";

            showProfileImageError(
                "Choose a PNG, JPEG or WebP image."
            );

            return;
        }

        if (file.size > MAX_PROFILE_IMAGE_SIZE) {
            profileImageInput.value = "";

            showProfileImageError(
                "The image must be 5 MB or smaller."
            );

            return;
        }

        revokePreviewUrl();

        previewObjectUrl = URL.createObjectURL(file);

        let preview = document.getElementById("profileImagePreview");

        if (!preview) {
            preview = document.createElement("img");

            preview.id = "profileImagePreview";
            preview.className = "profile-avatar-image";
            preview.alt = "Profile picture preview";

            const avatar = document.querySelector(".profile-avatar-edit");

            if (!avatar) {
                showProfileImageError(
                    "The profile picture preview could not be loaded."
                );

                return;
            }

            avatar.appendChild(preview);
        }

        preview.src = previewObjectUrl;
        preview.hidden = false;

        if (profileImageFallback) {
            profileImageFallback.hidden = true;
        }

        if (removeProfileImageInput) {
            removeProfileImageInput.value = "false";
        }

        if (removeProfileImageButton) {
            removeProfileImageButton.hidden = false;
        }

        if (profileImageName) {
            profileImageName.textContent = file.name;
        }

    });

}


// ==================================================
// REMOVE CURRENT PROFILE PICTURE
// ==================================================

if (removeProfileImageButton) {

    removeProfileImageButton.addEventListener("click", () => {

        if (profileImageInput) {
            profileImageInput.value = "";
        }

        revokePreviewUrl();

        showProfileImageFallback();
        showProfileImageError("");

        if (removeProfileImageInput) {
            removeProfileImageInput.value = "true";
        }

        if (profileImageName) {
            profileImageName.textContent =
                "Profile picture will be removed";
        }

        removeProfileImageButton.hidden = true;

    });

}


// ==================================================
// FORM SUBMISSION
// ==================================================

if (editProfileForm) {

    editProfileForm.addEventListener("submit", event => {

        const file = profileImageInput &&
            profileImageInput.files[0];

        if (
            file &&
            (
                !ALLOWED_PROFILE_IMAGE_TYPES.has(file.type) ||
                file.size > MAX_PROFILE_IMAGE_SIZE
            )
        ) {
            event.preventDefault();

            showProfileImageError(
                "Choose a valid image up to 5 MB."
            );

            profileImageInput.focus();
        }

    });

}


// ==================================================
// CLEANUP
// ==================================================

window.addEventListener("beforeunload", revokePreviewUrl);