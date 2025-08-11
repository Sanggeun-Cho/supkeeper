package com.toy.subkeeper.DTO;

import lombok.*;

public class SemesterDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterCreateDto {
        private String semName;
        private Long userId;
    }
}
