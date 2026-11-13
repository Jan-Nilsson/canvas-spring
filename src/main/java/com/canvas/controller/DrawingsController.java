
package com.canvas.controller;

import com.canvas.exception.DrawingAccessDeniedException;
import com.canvas.exception.DrawingNotFoundException;
import com.canvas.exception.InvalidDrawingNameException;
import com.canvas.exception.UnauthenticatedException;
import com.canvas.exception.UserNotFoundException;
import com.canvas.model.Drawing;
import com.canvas.service.DrawingService;
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
    public String drawings(
            @RequestParam(defaultValue = "mine") String tab,
            @RequestParam(defaultValue = "") String search,
            Model model) {

        try {
            String activeTab = "all".equals(tab) ? "all" : "mine";

            List<Drawing> drawings;

            if (activeTab.equals("mine")) {
                drawings = drawingService.findMyDrawings(search);
            } else {
                drawings = drawingService.findPublicDrawings(search);
            }

            model.addAttribute("drawings", drawings);
            model.addAttribute("activeTab", activeTab);
            model.addAttribute("search", search);

            return "drawings";

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }
    }

    @GetMapping("/{id}")
    public String drawing(
            @PathVariable Long id,
            Model model) {

        try {
            Drawing drawing = drawingService.findById(id);

            model.addAttribute("drawing", drawing);

            return "drawing";

        } catch (DrawingNotFoundException exception) {
            return "errors/404";

        } catch (DrawingAccessDeniedException exception) {
            return "errors/403";

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }
    }

    @PostMapping("/create")
    public String createDrawing(
            @RequestParam String drawingName,
            @RequestParam(defaultValue = "false") boolean visible,
            Model model) {

        try {
            drawingService.saveDrawing(drawingName, visible);

            return "redirect:/drawings?tab=mine";

        } catch (InvalidDrawingNameException exception) {
            model.addAttribute(
                    "invalidDrawingName",
                    "Drawing name is invalid"
            );

            return showMyDrawings(model);

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }
    }

    @PostMapping("/delete")
    public String deleteDrawing(
            @RequestParam Long drawingId,
            Model model) {

        try {
            drawingService.deleteDrawing(drawingId);

            return "redirect:/drawings?tab=mine";

        } catch (DrawingNotFoundException exception) {
            model.addAttribute(
                    "drawingNotFound",
                    "Drawing not found"
            );

        } catch (DrawingAccessDeniedException exception) {
            model.addAttribute(
                    "drawingAccessDenied",
                    "You are not allowed to delete this drawing"
            );

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }

        return showMyDrawings(model);
    }

    @PostMapping("/visibility")
    public String changeVisibility(
            @RequestParam Long drawingId,
            @RequestParam boolean visible,
            Model model) {

        try {
            drawingService.changeVisibility(drawingId, visible);

            return "redirect:/drawings?tab=mine";

        } catch (DrawingNotFoundException exception) {
            model.addAttribute(
                    "drawingNotFound",
                    "Drawing not found"
            );

        } catch (DrawingAccessDeniedException exception) {
            model.addAttribute(
                    "drawingAccessDenied",
                    "You are not allowed to change this drawing's visibility"
            );

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }

        return showMyDrawings(model);
    }

    private String showMyDrawings(Model model) {
        try {
            model.addAttribute(
                    "drawings",
                    drawingService.findMyDrawings("")
            );

            model.addAttribute("activeTab", "mine");
            model.addAttribute("search", "");

            return "drawings";

        } catch (UnauthenticatedException | UserNotFoundException exception) {
            return "redirect:/login";
        }
    }
}
