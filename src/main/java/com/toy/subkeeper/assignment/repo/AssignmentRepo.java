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
             ORDER BY a.dueDate ASC
             """)
    List<Assignment> findAllBySemesterIdOrderByDueDateAsc(@Param("semId") Long semId);

    // 학기에 해당하는 모든 과제
    @Query("""
           select a
             from Assignment a
             join a.subject s
             join s.semester sem
            where sem.id = :semId
            order by a.dueDate asc, a.id asc
           """)
    List<Assignment> findAllBySemesterIdOrderByDueDate(@Param("semId") Long semId);

    List<Assignment> findAllByIsComplete(Integer isComplete);
}
