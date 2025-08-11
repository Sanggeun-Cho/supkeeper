package com.toy.subkeeper.DTO;

import lombok.*;

public class UserDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserCreateReqDto {
        private String userName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserCreateResDto {
        private Long userId;
        private String userName;
    }
}
