
package com.canvas.controller;

import com.canvas.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@Controller
public class RegisterController {

    private final UserService userService;

    public RegisterController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @PostMapping("/register")
    public String register(
            @RequestParam String fullName,
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            Model model,
            HttpSession session) {

        Optional<Long> userId = userService.registerUser(
                fullName, username, password, confirmPassword
        );

        if (userId.isPresent()) {
            session.setAttribute("userId", userId.get());
            return "redirect:/canvas";
        }

        if (!userService.isValidFullName(fullName)) {
            model.addAttribute("invalidFullName",
                    "Full name must contain between 2 and 100 characters");
        }

        if (userService.checkUsername(username)) {
            model.addAttribute("usernameAlreadyExists",
                    username + " already exists");
        }

        if (userService.containsBannedWord(username)) {
            model.addAttribute("bannedWordMessage",
                    "You know why you're seeing this message lmao");
        }

        if (userService.isReserved(username)) {
            model.addAttribute("reservedUsernameMessage",
                    "Username is reserved for internal usage");
        }

        if (!userService.isValidPassword(password)) {
            model.addAttribute("invalidPassword",
                    "Password must contain at least 5 characters");
        }

        if (!userService.passwordsMatch(password, confirmPassword)) {
            model.addAttribute("passwordMismatch",
                    "Passwords do not match");
        }

        if (!userService.isValidUsername(username)) {
            model.addAttribute("invalidUsername",
                    "Username format is invalid");
        }

        model.addAttribute("fullName", fullName);
        model.addAttribute("username", username);

        return "register";
    }
}
