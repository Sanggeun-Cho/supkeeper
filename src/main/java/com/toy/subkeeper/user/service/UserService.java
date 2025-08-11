package com.toy.subkeeper.user.service;

import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor

public class UserService {
    private final UserRepo userRepo;

    // 사용자의 이름을 받아 사용자를 생성
    public User createUser(UserDto.UserCreateReqDto UserCreateReqDto){
        User user = new User(UserCreateReqDto.getUserName());
        User savedUser = userRepo.save(user);

        log.info("유저 생성: {} (id= {})", user.getUserName(), user.getId());

        return savedUser;
    }
}
