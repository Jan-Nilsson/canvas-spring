
package com.canvas.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jspecify.annotations.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler) throws IOException {

        HttpSession session = request.getSession(false);

        if (session != null
                && session.getAttribute("userId") instanceof Long) {
            return true;
        }

        response.sendRedirect(
                request.getContextPath() + "/login"
        );

        return false;
    }
}
