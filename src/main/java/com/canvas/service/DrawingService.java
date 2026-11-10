
package com.canvas.service;

import com.canvas.exception.DrawingAccessDeniedException;
import com.canvas.exception.DrawingNotFoundException;
import com.canvas.exception.UnauthenticatedException;
import com.canvas.exception.UserNotFoundException;
import com.canvas.model.Drawing;
import com.canvas.repository.DrawingRepository;
import com.canvas.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DrawingService {

    private final DrawingRepository drawingRepository;
    private final UserRepository userRepository;
    private final SessionService session;

    public DrawingService(
            DrawingRepository drawingRepository,
            UserRepository userRepository,
            SessionService session) {

        this.drawingRepository = drawingRepository;
        this.userRepository = userRepository;
        this.session = session;
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

        if (!drawing.getAuthorId().equals(userId)) {
            throw new DrawingAccessDeniedException();
        }

        return drawing;
    }

    public List<Drawing> findByNameSearch(String search) {
        return drawingRepository.findByNameSearch(search);
    }

    public Drawing findById(Long id) {
        return drawingRepository.findById(id);
    }

    public Long saveDrawing(String drawingName, boolean visible) {
        Long userId = getAuthenticatedUserId();

        Drawing drawing = new Drawing(null, drawingName, userId, visible);

        return drawingRepository.save(drawing).getId();
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
