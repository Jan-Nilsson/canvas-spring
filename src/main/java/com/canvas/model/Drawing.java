package com.canvas.model;

public class Drawing {
    private final long id;
    private String drawingName;
    private String author;

    public Drawing(Long id, String drawingName, String author) {
        this.id = id;
        this.drawingName = drawingName;
        this.author = author;
    }

    public Long getId() {
        return id;
    }

    public String getDrawingName() {
        return drawingName;
    }

    public void setDrawingName(String drawingName) {
        this.drawingName = drawingName;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }
}
