package com.toy.subkeeper.user.service;

import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor

public class UserService {
    private final UserRepo userRepo;

    // 사용자의 이름을 받아 사용자를 생성
    public User createUser(UserDto.UserCreateReqDto userCreateReqDto){
        String name = userCreateReqDto.getUserName().trim();

        // 이미 있는 유저 이름일 경우 해당 유저의 ID 반환
        Optional<User> existingUser = userRepo.findByUserName(name);
        if(existingUser.isPresent()){
            log.info("존재하는 사용자 이름: {} (id = {})", name, existingUser.get().getId());

            return existingUser.get();
        }

        User user = new User(name);
        User savedUser = userRepo.save(user);

        log.info("유저 생성: {} (id= {})", user.getUserName(), user.getId());

        return savedUser;
    }
}
