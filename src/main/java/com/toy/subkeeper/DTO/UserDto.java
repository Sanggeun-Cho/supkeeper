package com.toy.subkeeper.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class UserDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GoogleLoginReqDto {
        // 프론트에서 넘어오는 구글 ID 토큰
        private String credential;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserLoginResDto {
        private Long userId;
        private String userName;
        private String email;
        private Long lastSemId;
    }
}
