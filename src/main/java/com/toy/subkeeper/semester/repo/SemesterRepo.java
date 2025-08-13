package com.toy.subkeeper.semester.repo;

import com.toy.subkeeper.semester.domain.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SemesterRepo extends JpaRepository<Semester, Long> {
    boolean existsBySemName(String name);
}
