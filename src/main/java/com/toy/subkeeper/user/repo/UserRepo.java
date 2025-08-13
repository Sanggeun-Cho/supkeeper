package com.toy.subkeeper.user.repo;

import com.toy.subkeeper.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {
    // 존재하는 사용자인 경우
    Optional<User> findByUserName(String userName);
}
