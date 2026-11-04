'use strict'

const registerForm = document.getElementById("registerForm");
const regFullName = document.getElementById("regFullName");
const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regConfirm = document.getElementById("regConfirm");

function validateFullName() {
    const name = regFullName.value.trim();
    if (name.length < 2 || name.length > 150) return "Must be between 2 and 150 characters";
    const fullNameRegex = /^[\p{L}0-9' .-]+$/u;
    if (!fullNameRegex.test(name)) return "Invalid characters";
    return "";
}

function validateUsername() {
    const username = regUsername.value.trim();
    if (username.length < 2 || username.length > 50) return "Username must be between 2 and 50 characters";
    return "";
}

function validatePasswordRequirement() {
    return regPassword.value.length >= 5 ? "" : "Password must be at least 5 characters long";
}

function validatePasswordMatch() {
    return regPassword.value === regConfirm.value ? "" : "Passwords do not match";
}

function showInputError(input, message) {
    let wrapper = input.parentElement;
    let icon = wrapper.querySelector(".input-error-icon");

    if (message) {
        if (!icon) {
            icon = document.createElement("span");
            icon.className = "input-error-icon";
            icon.textContent = "×";
            wrapper.appendChild(icon);
        }
        icon.setAttribute("data-tooltip", message);
    } else if (icon) {
        icon.remove();
    }
}

function validateField(field) {
    if (field === regFullName) return showInputError(regFullName, validateFullName());
    if (field === regUsername) return showInputError(regUsername, validateUsername());
    if (field === regPassword) return showInputError(regPassword, validatePasswordRequirement());
    if (field === regConfirm) return showInputError(regConfirm, validatePasswordMatch());
}

regFullName.addEventListener("blur", () => validateField(regFullName));
regUsername.addEventListener("blur", () => validateField(regUsername));
regPassword.addEventListener("blur", () => validateField(regPassword));
regConfirm.addEventListener("blur", () => validateField(regConfirm));

registerForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const fullNameError = validateFullName();
    const usernameError = validateUsername();
    const passwordError = validatePasswordRequirement();
    const matchError = validatePasswordMatch();

    showInputError(regFullName, fullNameError);
    showInputError(regUsername, usernameError);
    showInputError(regPassword, passwordError);
    showInputError(regConfirm, matchError);

    if (!fullNameError && !usernameError && !passwordError && !matchError) {
        this.submit();
    }
});
