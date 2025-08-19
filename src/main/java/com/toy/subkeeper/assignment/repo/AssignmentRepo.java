package com.toy.subkeeper.assignment.repo;

import com.toy.subkeeper.assignment.domain.Assignment;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.Date;

public interface AssignmentRepo extends CrudRepository<Assignment, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
           UPDATE Assignment a
              SET a.isComplete = 2
            WHERE a.isComplete = 0
              AND a.dueDate BETWEEN :now AND :in24h
           """)
    int markDueSoonZeroToTwo(@Param("now") Date now, @Param("in24h") Date in24h);
}
