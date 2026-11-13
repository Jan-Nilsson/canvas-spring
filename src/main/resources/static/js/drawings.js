
document.addEventListener("DOMContentLoaded", () => {
    const deleteForms = document.querySelectorAll("[data-confirm-delete]");

    deleteForms.forEach(form => {
        form.addEventListener("submit", event => {
            const confirmed = window.confirm(
                "Are you sure you want to delete this drawing?"
            );

            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    const createForm = document.querySelector("#create-drawing-form");

    if (createForm) {
        createForm.addEventListener("submit", event => {
            const nameInput = document.querySelector("#drawingName");
            const errorMessage = document.querySelector("#create-error");

            if (nameInput.value.trim().length === 0) {
                event.preventDefault();
                errorMessage.textContent = "Drawing name cannot be empty.";
                nameInput.focus();
                return;
            }

            errorMessage.textContent = "";
            nameInput.value = nameInput.value.trim();
        });
    }
});
