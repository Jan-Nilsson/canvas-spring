package com.canvas.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.net.http.HttpRequest;

public class CanvasInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle (HttpServletRequest httpServletRequest,
                              HttpServletResponse httpServletResponse,
                              Object handler) throws IOException {

        return true;
    }

}
