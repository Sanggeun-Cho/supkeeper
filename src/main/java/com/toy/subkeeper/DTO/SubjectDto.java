package com.toy.subkeeper.DTO;

import lombok.*;

public class SubjectDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectCreateDto {
        private String subName;
        private Long semId;
    }
}
