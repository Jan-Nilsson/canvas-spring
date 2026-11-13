"use strict";


// ==================================================
// ELEMENTS
// ==================================================

const registerForm = document.getElementById("registerForm");

const regFullName = document.getElementById("regFullName");
const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regConfirm = document.getElementById("regConfirm");

const fullNameError = document.getElementById("fullNameError");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");


// ==================================================
// INITIALIZATION CHECK
// ==================================================

if (
    !registerForm ||
    !regFullName ||
    !regUsername ||
    !regPassword ||
    !regConfirm ||
    !fullNameError ||
    !usernameError ||
    !passwordError ||
    !confirmPasswordError
) {
    throw new Error("Register form is missing required HTML elements.");
}


// ==================================================
// FIELD ERROR DISPLAY
// ==================================================

function showFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    errorElement.hidden = message === "";

    input.setAttribute("aria-invalid", String(message !== ""));
}


// ==================================================
// REQUIRED FIELD VALIDATION
// ==================================================

function validateFullName() {
    const value = regFullName.value.trim();

    if (value.length === 0) {
        return "Please enter your full name.";
    }

    return "";
}

function validateUsername() {
    const value = regUsername.value.trim();

    if (value.length === 0) {
        return "Please enter a username.";
    }

    return "";
}


// ==================================================
// PASSWORD MATCH VALIDATION
// ==================================================

function validatePasswordMatch() {
    if (regConfirm.value.length === 0) {
        return "";
    }

    if (regPassword.value !== regConfirm.value) {
        return "Passwords do not match.";
    }

    return "";
}


// ==================================================
// FIELD VALIDATION
// ==================================================

function validateFullNameField() {
    const error = validateFullName();

    showFieldError(
        regFullName,
        fullNameError,
        error
    );

    return error === "";
}

function validateUsernameField() {
    const error = validateUsername();

    showFieldError(
        regUsername,
        usernameError,
        error
    );

    return error === "";
}

function validatePasswordMatchField() {
    const error = validatePasswordMatch();

    showFieldError(
        regConfirm,
        confirmPasswordError,
        error
    );

    return error === "";
}


// ==================================================
// INPUT EVENTS
// ==================================================

regFullName.addEventListener("blur", validateFullNameField);

regUsername.addEventListener("blur", validateUsernameField);

regPassword.addEventListener("input", () => {
    if (regConfirm.value.length > 0) {
        validatePasswordMatchField();
    }
});

regConfirm.addEventListener("input", validatePasswordMatchField);

regConfirm.addEventListener("blur", validatePasswordMatchField);


// Clear field errors as soon as the user corrects the value.
regFullName.addEventListener("input", () => {
    if (regFullName.value.trim().length > 0) {
        showFieldError(regFullName, fullNameError, "");
    }
});

regUsername.addEventListener("input", () => {
    if (regUsername.value.trim().length > 0) {
        showFieldError(regUsername, usernameError, "");
    }
});


// ==================================================
// FORM SUBMISSION
// ==================================================

registerForm.addEventListener("submit", event => {
    const fullNameValid = validateFullNameField();
    const usernameValid = validateUsernameField();
    const passwordMatchValid = validatePasswordMatchField();

    if (!fullNameValid || !usernameValid || !passwordMatchValid) {
        event.preventDefault();

        const firstInvalidField = [
            [fullNameValid, regFullName],
            [usernameValid, regUsername],
            [passwordMatchValid, regConfirm]
        ].find(([valid]) => !valid);

        if (firstInvalidField) {
            firstInvalidField[1].focus();
        }

        return;
    }

    // Match the server's full-name trimming behaviour.
    regFullName.value = regFullName.value.trim();

    // Let the browser submit the form normally.
    // Do not call form.submit(), which would bypass native validation.
});