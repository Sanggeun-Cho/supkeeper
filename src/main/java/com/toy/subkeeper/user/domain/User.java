package com.toy.subkeeper.user.domain;

import com.toy.subkeeper.semester.domain.Semester;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity @Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userName;

    @OneToMany(mappedBy = "user")
    private List<Semester> semesterList = new ArrayList<>();

    public User(String userName) {
        this.userName = userName;
    }
}
