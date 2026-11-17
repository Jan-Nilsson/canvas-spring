"use strict";

/*
 * Shared application theme.
 * The selected theme is stored in localStorage.
 */

const THEME_STORAGE_KEY = "canvas.theme";
const DEFAULT_THEME = "dark";


function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        if (savedTheme === "light" || savedTheme === "dark") {
            return savedTheme;
        }
    } catch (error) {
        // localStorage may be unavailable.
    }

    return DEFAULT_THEME;
}


function applyTheme(theme) {
    const selectedTheme =
        theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = selectedTheme;

    if (document.body) {
        document.body.dataset.theme = selectedTheme;
    }

    const themeToggleButton =
        document.querySelector("#themeToggleBtn");

    if (themeToggleButton) {
        const nextTheme =
            selectedTheme === "dark" ? "light" : "dark";

        const label =
            nextTheme === "light"
                ? "Switch to light theme"
                : "Switch to dark theme";

        themeToggleButton.setAttribute("aria-label", label);
        themeToggleButton.setAttribute("title", label);

        const visibleLabel =
            themeToggleButton.querySelector(".theme-toggle-label");

        if (visibleLabel) {
            visibleLabel.textContent =
                selectedTheme === "dark" ? "Dark" : "Light";
        }
    }
}


function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        // The theme still works for the current page.
    }
}


function initializeTheme() {
    const initialTheme = getSavedTheme();

    applyTheme(initialTheme);

    const themeToggleButton =
        document.querySelector("#themeToggleBtn");

    if (!themeToggleButton) {
        return;
    }

    themeToggleButton.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.dataset.theme || DEFAULT_THEME;

        const nextTheme =
            currentTheme === "dark" ? "light" : "dark";

        applyTheme(nextTheme);
        saveTheme(nextTheme);
    });
}


/*
 * Shared profile dropdown used by every authenticated page.
 */

function initializeProfileMenu() {
    const profileMenuRoot =
        document.querySelector("[data-profile-menu]");

    if (!profileMenuRoot) {
        return;
    }

    const profileMenuButton =
        profileMenuRoot.querySelector("#profileMenuButton");

    const profileMenu =
        profileMenuRoot.querySelector("#profileMenu");

    if (!profileMenuButton || !profileMenu) {
        return;
    }


    function closeProfileMenu(returnFocus = false) {
        profileMenu.hidden = true;

        profileMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        if (returnFocus) {
            profileMenuButton.focus();
        }
    }


    function openProfileMenu() {
        profileMenu.hidden = false;

        profileMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    profileMenuButton.addEventListener("click", () => {
        const isOpen =
            profileMenuButton.getAttribute("aria-expanded") === "true";

        if (isOpen) {
            closeProfileMenu();
        } else {
            openProfileMenu();
        }
    });


    document.addEventListener("pointerdown", event => {
        if (!profileMenuRoot.contains(event.target)) {
            closeProfileMenu();
        }
    });


    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !profileMenu.hidden) {
            event.preventDefault();
            closeProfileMenu(true);
        }
    });


    profileMenu.addEventListener("click", event => {
        if (event.target.closest("a")) {
            closeProfileMenu();
        }
    });
}


/*
 * Initialize shared navbar features.
 */

function initializeNavbar() {
    initializeTheme();
    initializeProfileMenu();
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavbar);
} else {
    initializeNavbar();
}