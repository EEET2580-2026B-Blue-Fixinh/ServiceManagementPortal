package com.fixinh.smt.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<?> notFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, ex.code(), ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        var fields = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "code", "INVALID_VALUE", "message",
                        e.getDefaultMessage() == null ? "Invalid value" : e.getDefaultMessage()))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "One or more fields are invalid.", request, fields);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid(IllegalArgumentException ex, HttpServletRequest request) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_REQUEST", ex.getMessage(), request, List.of());
    }

    private ResponseEntity<?> error(HttpStatus status, String code, String message,
            HttpServletRequest request, List<?> fieldErrors) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(), "path", request.getRequestURI(),
                "status", status.value(), "error", code, "message", message,
                "fieldErrors", fieldErrors));
    }
}
