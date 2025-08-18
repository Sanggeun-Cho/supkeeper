package com.toy.subkeeper.DTO;

import lombok.*;

public class SubjectDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectCreateReqDto {
        private String subName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectCreateResDto {
        private Long subId;
        private String subName;
    }
}
