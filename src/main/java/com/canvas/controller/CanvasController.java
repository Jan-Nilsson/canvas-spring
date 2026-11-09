package com.canvas.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Objects;

@Controller
public class CanvasController {
    @GetMapping("/canvas")
    public String canvas(HttpSession session) {
        if (Objects.nonNull(session.getAttribute("userId"))) {
            return "canvas";
        }
        return "login";
    }

    @PostMapping
    public String canvasPost(@RequestParam String drawingName,
                             HttpSession session,
                             Model model) {


        if (true) {
            model.addAttribute("drawingName", drawingName);
            model.addAttribute("confirmationMessage",
                    "Drawing has been saved successfully");
        }

        return "canvas";
    }


}
