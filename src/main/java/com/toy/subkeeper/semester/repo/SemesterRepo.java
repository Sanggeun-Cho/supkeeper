package com.toy.subkeeper.semester.repo;

import com.toy.subkeeper.semester.domain.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SemesterRepo extends JpaRepository<Semester, Long> {
    boolean existsByUser_UserIdAndSemName(Long userId, String semName);

    // 과도한 fetch join 방지를 위한 Semester + User 로드 단계
    @Query("""
            SELECT s
              FROM Semester s
              JOIN FETCH s.user u
             WHERE s.id = :semId
            """)
    Optional<Semester> findByIdWithUser(@Param("semId") Long semId);

    // 사용자가 가진 학기수
    List<Semester> findByUser_IdOrderByIdDesc(Long userId);

    // 사용자의 학기 수 중 가장 최근 학기 (맨 처음 대시보드)
    Optional<Semester> findTopByUser_IdOrderByIdDesc(Long userId);
}
