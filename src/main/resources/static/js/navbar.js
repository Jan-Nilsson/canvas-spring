"use strict";

// Shared profile dropdown used by every authenticated page.

const profileMenuRoot = document.querySelector("[data-profile-menu]");

if (profileMenuRoot) {
    const profileMenuButton =
        profileMenuRoot.querySelector("#profileMenuButton");

    const profileMenu =
        profileMenuRoot.querySelector("#profileMenu");

    if (profileMenuButton && profileMenu) {

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
}