package com.toy.subkeeper.user.controller;

import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.service.UserService;
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
    public ResponseEntity<UserDto.UserCreateResDto> createUser(@RequestBody UserDto.UserCreateReqDto UserCreateDto){
        User savedUser = userService.createUser(UserCreateDto);
        UserDto.UserCreateResDto userDto = new UserDto.UserCreateResDto(savedUser.getId(), savedUser.getUserName());

        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);
    }
}
