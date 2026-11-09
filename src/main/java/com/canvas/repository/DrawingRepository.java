package com.canvas.repository;

import com.canvas.model.Drawing;

import java.util.List;
import java.util.Optional;

public interface DrawingRepository {
    List<Drawing> findByNameSearch(String drawingNameSearch);
    Drawing findById(Long id);
    Drawing save(String drawingName, String author);
}
