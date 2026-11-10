package com.canvas.model;

public class Drawing {
    private final Long id;
    private String drawingName;
    private final Long authorId;
    private boolean visible;

    public Drawing(Long id, String drawingName, Long authorId, boolean visible) {
        this.id = id;
        this.drawingName = drawingName;
        this.authorId = authorId;
        this.visible = visible;
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

    public Long getAuthorId() {
        return authorId;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }
}
