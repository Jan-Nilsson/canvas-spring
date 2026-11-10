
package com.canvas.controller;

import com.canvas.model.Drawing;
import com.canvas.service.DrawingService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/drawings")
public class DrawingsController {

    private final DrawingService drawingService;

    public DrawingsController(DrawingService drawingService) {
        this.drawingService = drawingService;
    }

    @GetMapping
    public String drawings(HttpSession session, Model model) {
        if (session.getAttribute("userId") == null) {
            return "redirect:/login";
        }

        List<Drawing> drawings = drawingService.findByNameSearch(null);

        model.addAttribute("drawings", drawings);

        return "drawings";
    }

    @GetMapping("/search")
    public String searchDrawings(
            @RequestParam String search,
            Model model) {

        List<Drawing> drawings =
                drawingService.findByNameSearch(search);

        model.addAttribute("drawings", drawings);

        return "drawings";
    }

    @PostMapping("/create")
    public String createDrawing(
            @RequestParam String drawingName,
            @RequestParam(defaultValue = "false") boolean visible) {

        drawingService.saveDrawing(drawingName, visible);

        return "redirect:/drawings";
    }

    @PostMapping("/delete")
    public String deleteDrawing(@RequestParam Long drawingId) {

        drawingService.deleteDrawing(drawingId);

        return "redirect:/drawings";
    }

    @PostMapping("/visibility")
    public String changeVisibility(
            @RequestParam Long drawingId,
            @RequestParam boolean visible) {

        drawingService.changeVisibility(drawingId, visible);

        return "redirect:/drawings";
    }
}
