package com.toy.subkeeper.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class SubjectDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectCreateReqDto {
        @NotNull(message = "과목명 필수")
        @Size(max = 50)
        private String subName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectCreateResDto {
        private Long subId;
        private String subName;
    }
}
