package com.canvas.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final HttpSession session;

    public SessionService(HttpSession session) {
        this.session = session;
    }

    public Long getCurrentUserId() {
        return (Long) session.getAttribute("userId");
    }

    public boolean isAuthenticated() {
        return getCurrentUserId() != null;
    }
}