
package com.canvas.advice;

import com.canvas.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.ModelAndView;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ModelAndView handleUserNotFound(
            UserNotFoundException exception) {

        return createErrorPage(HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DrawingNotFoundException.class)
    public ModelAndView handleDrawingNotFound(
            DrawingNotFoundException exception) {

        return createErrorPage(HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DrawingAccessDeniedException.class)
    public ModelAndView handleDrawingAccessDenied(
            DrawingAccessDeniedException exception) {

        return createErrorPage(HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidUserRegistrationException.class)
    public ModelAndView handleInvalidUserRegistration(
            InvalidUserRegistrationException exception) {

        return createErrorPage(HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidDrawingNameException.class)
    public ModelAndView handleInvalidDrawingName(
            InvalidDrawingNameException exception) {

        return createErrorPage(HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public String handleUnauthenticated(
            UnauthenticatedException exception) {

        return "redirect:/login";
    }

    private ModelAndView createErrorPage(HttpStatus status) {

        ModelAndView modelAndView = new ModelAndView(
                "error/" + status.value()
        );

        modelAndView.setStatus(status);

        return modelAndView;
    }
}
