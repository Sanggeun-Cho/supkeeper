package com.toy.subkeeper.user.controller;

import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    @Operation(summary = "유저 생성",
            description = "사용자의 이름을 받아 새로운 사용자인 경우 새로 생성, 존재하는 사용자인 경우 해당 사용자의 ID를 반환합니다.<br>" +
                    "Req : {userName}<br>" +
                    "Res : {userId, userName}")
    public ResponseEntity<UserDto.UserCreateResDto> createUser(@RequestBody UserDto.UserCreateReqDto reqDto){
        User savedUser = userService.createUser(reqDto);
        UserDto.UserCreateResDto userDto = new UserDto.UserCreateResDto(savedUser.getId(), savedUser.getUserName());

        return ResponseEntity.ok(userDto);
    }
}
