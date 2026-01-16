package com.toy.subkeeper.repository;

import com.toy.subkeeper.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {
    /**
     * 구글 로그인으로 수정
     * 이메일로 unique한 유저 관리
     */
    Optional<User> findByEmail(String email);
}
