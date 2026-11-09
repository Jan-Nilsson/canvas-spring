package com.canvas.repository;

import com.canvas.model.Drawing;
import com.canvas.model.User;

import java.util.*;

public class DrawingRepositoryMemory implements DrawingRepository {

    private final Map<Long, Drawing> drawings = new HashMap<>();
    private long nextId = 1;

    @Override
    public List<Drawing> findByNameSearch(String drawingNameSearch) {
        if (Objects.isNull(drawingNameSearch) || drawingNameSearch.isBlank()) {
            return List.of();
        }

        String search = drawingNameSearch.trim().toLowerCase();

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
    public Drawing save(String drawingName, String author) {
        Drawing drawing = new Drawing(nextId++, drawingName, author);

        drawings.put(drawing.getId(), drawing);

        return drawing;
    }
}
