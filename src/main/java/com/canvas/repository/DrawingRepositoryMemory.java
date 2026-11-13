package com.canvas.repository;

import com.canvas.model.Drawing;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class DrawingRepositoryMemory implements DrawingRepository {

    private final Map<Long, Drawing> drawings = new HashMap<>();
    private long nextId = 1;

    @Override
    public List<Drawing> findAll() {
        return new ArrayList<>(drawings.values());
    }

    @Override
    public List<Drawing> findByNameSearch(String drawingNameSearch) {
        if (drawingNameSearch == null || drawingNameSearch.isBlank()) {
            return List.of();
        }

        String search = drawingNameSearch.trim().toLowerCase(Locale.ROOT);

        return drawings.values().stream()
                .filter(drawing -> drawing.getDrawingName()
                        .toLowerCase()
                        .contains(search))
                .toList();
    }

    @Override
    public Drawing findById(Long id) {
        return drawings.get(id);
    }

    @Override
    public Drawing save(Drawing drawing) {
        if (drawing.getId() == null) {
            drawing = new Drawing(
                    nextId++,
                    drawing.getDrawingName(),
                    drawing.getAuthorId(),
                    drawing.isVisible()
            );
        }

        drawings.put(drawing.getId(), drawing);
        return drawing;
    }

    @Override
    public void deleteById(Long id) {
        drawings.remove(id);
    }
}
