
(() => {
    console.info("[profile-edit] JavaScript loaded");

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    let currentPreviewUrl = null;

    // Listen for file selection, even if the input is created later.
    document.addEventListener("change", (event) => {
        const input = event.target;

        if (!input || input.id !== "profileImage") {
            return;
        }

        console.info("[profile-edit] File selection detected");

        const file = input.files && input.files[0];

        if (!file) {
            return;
        }

        const preview = document.querySelector(".profile-avatar-preview");

        if (!preview) {
            console.error("[profile-edit] Preview container not found");
            return;
        }

        // Validate file format.
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert("Please select a JPG, PNG or WebP image.");
            input.value = "";
            return;
        }

        // Validate file size.
        if (file.size > MAX_IMAGE_SIZE) {
            alert("The image cannot exceed 5 MB.");
            input.value = "";
            return;
        }

        // Create a temporary local URL. Nothing is uploaded yet.
        const newPreviewUrl = URL.createObjectURL(file);

        let previewImage = preview.querySelector("img");

        if (!previewImage) {
            previewImage = document.createElement("img");
            previewImage.alt = "Profile picture preview";
            preview.replaceChildren(previewImage);
        }

        previewImage.onload = () => {
            if (currentPreviewUrl !== null) {
                URL.revokeObjectURL(currentPreviewUrl);
            }

            currentPreviewUrl = newPreviewUrl;

            console.info("[profile-edit] Preview updated");
        };

        previewImage.onerror = () => {
            URL.revokeObjectURL(newPreviewUrl);
            console.error("[profile-edit] Could not display selected image");
            alert("The selected image could not be displayed.");
        };

        previewImage.src = newPreviewUrl;
    });

    // Biography character counter.
    const updateBioCounter = () => {
        const bioInput = document.getElementById("bio");
        const bioCounter = document.getElementById("bioCounter");

        if (bioInput && bioCounter) {
            bioCounter.textContent = `${bioInput.value.length}/500`;
        }
    };

    document.addEventListener("input", (event) => {
        if (event.target && event.target.id === "bio") {
            updateBioCounter();
        }
    });

    updateBioCounter();

    // Prevent multiple form submissions.
    document.addEventListener("submit", (event) => {
        const form = event.target;

        if (!form.matches('form[enctype="multipart/form-data"]')) {
            return;
        }

        const saveButton = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (saveButton) {
            saveButton.disabled = true;

            if (saveButton.tagName === "BUTTON") {
                saveButton.textContent = "Saving...";
            }
        }
    });

    // Release the temporary URL when leaving the page.
    window.addEventListener("beforeunload", () => {
        if (currentPreviewUrl !== null) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = null;
        }
    });
})();
