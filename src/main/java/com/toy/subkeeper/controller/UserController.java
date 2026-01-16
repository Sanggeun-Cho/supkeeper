package com.toy.subkeeper.controller;

import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.domain.User;
import com.toy.subkeeper.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")

public class UserController {
    private final UserService userService;

    @PostMapping("/login/google")
    @Operation(summary = "구글 로그인",
    description = "구글 ID 토큰을 받아 유저를 조회하거나 생성")
    public ResponseEntity<UserDto.UserLoginResDto> googleLogin(@RequestBody UserDto.GoogleLoginReqDto reqDto) {
        User user = userService.loginOrSignUp(reqDto.getCredential());
        Long lastSemId = userService.findLastSemId(user.getId());

        UserDto.UserLoginResDto resDto = UserDto.UserLoginResDto.builder()
                .userId(user.getId())
                .userName(user.getUserName())
                .email(user.getEmail())
                .lastSemId(lastSemId)
                .build();

        return ResponseEntity.ok(resDto);
    }
}
