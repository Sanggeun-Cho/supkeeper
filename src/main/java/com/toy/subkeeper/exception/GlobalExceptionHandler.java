package com.toy.subkeeper.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 학기 이름 중복 예외
    @ExceptionHandler(DuplicateSemNameException.class)
    public ResponseEntity<String> handleDuplicateSemNameException(DuplicateSemNameException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }

    // 과목 이름 중복 예외
    @ExceptionHandler(DuplicateSubNameException.class)
    public ResponseEntity<String> handleDuplicateSubNameException(DuplicateSubNameException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }

    // DB 위반 예외
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Duplicate key or constraint violation.");
    }
}
