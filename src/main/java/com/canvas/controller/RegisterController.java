
package com.canvas.controller;

import com.canvas.exception.InvalidUserRegistrationException;
import com.canvas.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

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
            Model model) {
        
        try {
            userService.registerUser(
                    fullName,
                    username,
                    password,
                    confirmPassword
            );

            return "redirect:/login";

        } catch (InvalidUserRegistrationException exception) {

            model.addAllAttributes(exception.getErrors());

            model.addAttribute("fullName", fullName);
            model.addAttribute("username", username);

            return "register";
        }
    }
}
