package com.canvas.config;

import com.canvas.interceptor.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class InterceptorConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(new AuthInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/login",
                        "/register",
                        "/u/**",
                        "/profile/image/**",
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/favicon.ico",
                        "/error"
                );
    }
}