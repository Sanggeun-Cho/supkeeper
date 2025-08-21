package com.toy.subkeeper.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class SemesterDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterCreateReqDto {
        @NotNull(message = "학기명 필수")
        @Size(max = 50)
        private String semName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SemesterCreateResDto {
        private Long semId;
        private String semName;
    }
}
