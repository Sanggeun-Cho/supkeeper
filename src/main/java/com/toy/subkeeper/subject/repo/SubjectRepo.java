package com.toy.subkeeper.subject.repo;

import com.toy.subkeeper.subject.domain.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepo extends JpaRepository<Subject, Long> {
    boolean existsBySubName(String subName);
}
