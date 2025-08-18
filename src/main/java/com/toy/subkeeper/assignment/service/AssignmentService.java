package com.toy.subkeeper.assignment.service;

import com.toy.subkeeper.DTO.AssignmentDto;
import com.toy.subkeeper.assignment.domain.Assignment;
import com.toy.subkeeper.assignment.repo.AssignmentRepo;
import com.toy.subkeeper.subject.domain.Subject;
import com.toy.subkeeper.subject.repo.SubjectRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.spel.ast.Assign;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor

public class AssignmentService {
    private final AssignmentRepo assignmentRepo;
    private final SubjectRepo subjectRepo;

    // 과제 생성
    public Assignment createAssignment(Long subId, AssignmentDto.AssignmentCreateReqDto reqDto) {
        // SubId 조회
        Subject subject = subjectRepo.findById(subId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다."));

        // 새로운 과제 생성
        Assignment assignment = new Assignment(
                reqDto.getAssignName(),
                reqDto.getDueDate(),
                reqDto.getCategory(),
                subject,
                0
        );
        assignmentRepo.save(assignment);

        log.info("과제 생성: {} (id= {})", assignment.getAssignName(), assignment.getId());

        return assignment;
    }

    // 과제 수정
    @Transactional
    public Assignment updateAssignment(Long assignmentId, AssignmentDto.AssignmentUpdateReqDto reqDto) {
        Assignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과제입니다."));

        if(reqDto.getSubId() != null) {
            Subject subject = subjectRepo.findById(reqDto.getSubId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과목입니다."));
            assignment.setSubject(subject);
        }
        if(reqDto.getAssignName() != null) {
            String name = reqDto.getAssignName().trim();
            if (name.isEmpty()) throw new IllegalArgumentException("과제명을 적어주세요.");
            assignment.setAssignName(name);
        }
        if(reqDto.getDueDate() != null) {
            assignment.setDueDate(reqDto.getDueDate());
        }
        if(reqDto.getCategory() != null) {
            assignment.setCategory(reqDto.getCategory());
        }

        log.info("과제 수정: {} (id= {})", assignment.getAssignName(), assignment.getId());
        return assignment;
    }

    // 과제 삭제
    @Transactional
    public void deleteAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepo.findById(assignmentId)
                        .orElseThrow(() -> new RuntimeException("과제를 찾을 수 없습니다."));

        log.info("과제 삭제: (id= {})", assignment.getId());

        assignmentRepo.deleteById(assignmentId);
    }
}
