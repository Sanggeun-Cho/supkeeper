package com.toy.subkeeper.user.repo;

import com.toy.subkeeper.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User, Long> {
}
