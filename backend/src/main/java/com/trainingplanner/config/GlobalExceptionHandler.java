package com.trainingplanner.config;

import com.trainingplanner.auth.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation failed");
        problem.setDetail(ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce("", (a, b) -> a.isEmpty() ? b : a + "; " + b));
        return problem;
    }

    @ExceptionHandler(UserService.EmailAlreadyUsedException.class)
    public ProblemDetail handleEmailAlreadyUsed(UserService.EmailAlreadyUsedException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Email already registered");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(UserService.InvalidCredentialsException.class)
    public ProblemDetail handleInvalidCredentials(UserService.InvalidCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setTitle("Invalid credentials");
        problem.setDetail(ex.getMessage());
        return problem;
    }

    @ExceptionHandler(UserService.InvalidTokenException.class)
    public ProblemDetail handleInvalidToken(UserService.InvalidTokenException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setTitle("Invalid token");
        problem.setDetail(ex.getMessage());
        return problem;
    }
}
