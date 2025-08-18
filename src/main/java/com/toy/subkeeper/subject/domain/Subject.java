package com.toy.subkeeper.subject.domain;

import com.toy.subkeeper.assignment.domain.Assignment;
import com.toy.subkeeper.semester.domain.Semester;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity @Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subject {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subName;

    // 과제와 one to many 관계, 과목이 삭제되면 과제들도 모두 지워짐
    @OneToMany(mappedBy = "assginment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assginmentList = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "sem_id")
    private Semester semester;


    public Subject(String subName, Semester semester) {
        this.subName = subName;
        this.semester = semester;
    }
}
