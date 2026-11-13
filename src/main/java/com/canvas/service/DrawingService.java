
package com.canvas.service;

import com.canvas.exception.DrawingAccessDeniedException;
import com.canvas.exception.DrawingNotFoundException;
import com.canvas.exception.InvalidDrawingNameException;
import com.canvas.exception.UnauthenticatedException;
import com.canvas.exception.UserNotFoundException;
import com.canvas.model.Drawing;
import com.canvas.repository.DrawingRepository;
import com.canvas.repository.UserRepository;
import com.canvas.validation.validator.DrawingNameValidator;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DrawingService {

    private final DrawingRepository drawingRepository;
    private final UserRepository userRepository;
    private final SessionService session;
    private final DrawingNameValidator drawingNameValidator;

    public DrawingService(
            DrawingRepository drawingRepository,
            UserRepository userRepository,
            SessionService session,
            DrawingNameValidator drawingNameValidator) {

        this.drawingRepository = drawingRepository;
        this.userRepository = userRepository;
        this.session = session;
        this.drawingNameValidator = drawingNameValidator;
    }

    private Long getAuthenticatedUserId() {
        Long userId = session.getCurrentUserId();

        if (userId == null) {
            throw new UnauthenticatedException();
        }

        userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        return userId;
    }

    private Drawing validateDrawingOwnership(Long drawingId) {
        Long userId = getAuthenticatedUserId();

        Drawing drawing = drawingRepository.findById(drawingId);

        if (drawing == null) {
            throw new DrawingNotFoundException();
        }

        if (!userId.equals(drawing.getAuthorId())) {
            throw new DrawingAccessDeniedException();
        }

        return drawing;
    }

    private boolean canViewDrawing(Drawing drawing, Long userId) {
        return drawing.isVisible()
                || userId.equals(drawing.getAuthorId());
    }

    private List<Drawing> findDrawingsMatchingSearch(String search) {
        if (search == null || search.isBlank()) {
            return drawingRepository.findAll();
        }

        return drawingRepository.findByNameSearch(search);
    }

    public List<Drawing> findAll() {
        Long userId = getAuthenticatedUserId();

        return drawingRepository.findAll().stream()
                .filter(drawing -> canViewDrawing(drawing, userId))
                .toList();
    }

    public List<Drawing> findByNameSearch(String search) {
        Long userId = getAuthenticatedUserId();

        return findDrawingsMatchingSearch(search).stream()
                .filter(drawing -> canViewDrawing(drawing, userId))
                .toList();
    }

    public List<Drawing> findMyDrawings(String search) {
        Long userId = getAuthenticatedUserId();

        return findDrawingsMatchingSearch(search).stream()
                .filter(drawing -> userId.equals(drawing.getAuthorId()))
                .toList();
    }

    public List<Drawing> findPublicDrawings(String search) {
        Long userId = getAuthenticatedUserId();

        return findDrawingsMatchingSearch(search).stream()
                .filter(Drawing::isVisible)
                .filter(drawing -> !userId.equals(drawing.getAuthorId()))
                .toList();
    }

    public Drawing findById(Long id) {
        Long userId = getAuthenticatedUserId();

        Drawing drawing = drawingRepository.findById(id);

        if (drawing == null) {
            throw new DrawingNotFoundException();
        }

        if (!canViewDrawing(drawing, userId)) {
            throw new DrawingAccessDeniedException();
        }

        return drawing;
    }

    public void saveDrawing(String drawingName, boolean visible) {
        Long userId = getAuthenticatedUserId();

        if (!drawingNameValidator.isValid(drawingName)) {
            throw new InvalidDrawingNameException();
        }

        Drawing drawing = new Drawing(
                null,
                drawingName.trim(),
                userId,
                visible
        );

        drawingRepository.save(drawing);
    }

    public void deleteDrawing(Long id) {
        validateDrawingOwnership(id);

        drawingRepository.deleteById(id);
    }

    public Drawing changeVisibility(Long id, boolean visible) {
        Drawing drawing = validateDrawingOwnership(id);

        drawing.setVisible(visible);

        return drawingRepository.save(drawing);
    }
}
