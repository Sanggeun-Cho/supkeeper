package com.toy.subkeeper.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class UserDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserCreateReqDto {
        @NotNull(message = "사용자 필수")
        @Size(max = 50)
        private String userName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserCreateResDto {
        private Long userId;
        private String userName;
    }
}
