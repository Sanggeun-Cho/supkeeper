package com.toy.subkeeper.domain;

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

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(unique = false, nullable = false, length = 50)
    private String userName;

    @OneToMany(mappedBy = "user")
    private List<Semester> semesterList = new ArrayList<>();

    public User(String email, String userName) {
        this.email = email;
        this.userName = userName;
    }
}
