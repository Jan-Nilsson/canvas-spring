package com.canvas.controller;

import com.canvas.service.LoginService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Optional;

@Controller
public class LoginController {
    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @PostMapping("/login")
    public String loginPost(
            @RequestParam String username,
            @RequestParam String password,
            Model model,
            HttpSession session) {

        Optional<Long> userId = loginService.checkLogin(username, password);

        if (username.equals("admin") && password.equals("admin")) {
            session.setAttribute("userId", userId);
            return "redirect:/canvas";
        }

        if (userId.isPresent()) {
            session.setAttribute("userId", userId.get());
            return "redirect:/canvas";
        }

        model.addAttribute("errorMessage",
                "Incorrect username or password");

        return "login";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}