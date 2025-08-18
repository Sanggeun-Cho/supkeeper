package com.toy.subkeeper.assignment.repo;

import com.toy.subkeeper.assignment.domain.Assignment;
import org.springframework.data.repository.CrudRepository;

public interface AssignmentRepo extends CrudRepository<Assignment, Long> {
}
