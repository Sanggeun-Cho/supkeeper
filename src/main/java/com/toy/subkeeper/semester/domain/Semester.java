package com.toy.subkeeper.semester.domain;

import com.toy.subkeeper.subject.domain.Subject;
import com.toy.subkeeper.user.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity @Builder @Getter @AllArgsConstructor @NoArgsConstructor
public class Semester {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String semName;

    // 과목과 one to many 관계, 학기가 삭제되면 과목들도 모두 지워짐
    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Subject> subjectList = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
