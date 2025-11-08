package com.toy.subkeeper.subject.repo;

import com.toy.subkeeper.subject.domain.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepo extends JpaRepository<Subject, Long> {
    boolean existsBySemester_IdAndSubName(Long semId, String subName);

    // 학기와 과제 관계성
    List<Subject> findBySemester_Id(Long semId);
}
