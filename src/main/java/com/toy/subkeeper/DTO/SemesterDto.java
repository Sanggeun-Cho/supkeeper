package com.toy.subkeeper.DTO;

import lombok.*;

public class SemesterDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterCreateReqDto {
        private String semName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterCreateResDto {
        private Long semId;
        private String semName;
    }
}
