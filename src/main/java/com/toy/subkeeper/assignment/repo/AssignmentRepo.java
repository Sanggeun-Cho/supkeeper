package com.toy.subkeeper.assignment.repo;

import com.toy.subkeeper.assignment.domain.Assignment;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.expression.spel.ast.Assign;

import java.util.Collection;
import java.util.Date;
import java.util.List;

public interface AssignmentRepo extends CrudRepository<Assignment, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
           UPDATE Assignment a
              SET a.isComplete = 2
            WHERE a.isComplete = 0
              AND a.dueDate BETWEEN :now AND :in24h
           """)
    int markDueSoonZeroToTwo(@Param("now") Date now, @Param("in24h") Date in24h);

    // Semester 기준으로 모든 Assignment 조회
    @Query("""
            SELECT a
              FROM Assignment a
              JOIN a.subject sub
              JOIN sub.semester sem
             WHERE sem.id = :semId
             """)
    List<Assignment> findAllBySemesterIdOrderByIdDesc(@Param("semId") Long semId);

    // 미완료 과제 최신순 정렬 (0, 2)
    List<Assignment> findBySubject_Semester_IdAndIsCompleteInOrderByIdDesc(
            Long semId, Collection<Integer> isComplete);

    // 완료 과제 최신순 정렬 (1)
    List<Assignment> findBySubject_Semester_IdAndIsCompleteInOrderByIdDesc(
            Long semId, int isComplete);
}
