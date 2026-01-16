package com.toy.subkeeper.domain;

import com.toy.subkeeper.domain.Subject;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity @Getter @NoArgsConstructor @AllArgsConstructor @Builder
@Setter // 내용 수정용
public class Assignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String assignName;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date dueDate;

    @Column(nullable = false)
    private Integer category; // 0 : 과제, 1 : 강의, 2 : 할 일

    @Column(nullable = false)
    private int isComplete; // 0 : 미완료, 1 : 완료, 2 : 하루 남은 과제

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sub_id", nullable = false)
    private Subject subject;

    public Assignment(String assignName, Date dueDate, int category, Subject subject, int isComplete) {
        this.assignName = assignName;
        this.dueDate = dueDate;
        this.category = category;
        this.subject = subject;
        this.isComplete = isComplete;
    }
}
