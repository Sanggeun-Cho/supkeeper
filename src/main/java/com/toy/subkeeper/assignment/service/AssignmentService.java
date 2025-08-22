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

import java.util.Date;

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

    // 과제 완료 상태 변경
    /**
     * 요청이 1이면 무조건 1 (완료 상태)
     * 요청이 0이고 마감 24시간 이내면 2 (마감 임박 상태)
     * 그 외는 0 (미완료 상태)
     */
    @Transactional
    public Assignment updateCompleteState(Long assignmentId, Integer state){
        Assignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과제입니다."));

        int defaultState = (state != null && state == 1) ? 1 : 0;

        if(defaultState == 0 && isDueWithin24Hours(assignment.getDueDate())){
            assignment.setIsComplete(2);
        } else {
            assignment.setIsComplete(defaultState);
        }

        log.info("과제 완료상태 변경: id={}, isComplete={}", assignmentId, assignment.getIsComplete());

        return assignment;
    }

    private boolean isDueWithin24Hours(Date due){
        if (due == null) return false;

        long now = System.currentTimeMillis();
        long diff = due.getTime() - now;

        return diff >= 0 && diff <= 24L * 60 * 60 * 1000;
    }

    // 자정에 과제 완료 상태 리프레시를 위한 함수
    @Transactional
    public int refreshZeroToTwoForDueSoon() {
        Date now = new Date();
        Date in24th = new Date(now.getTime() + 24L * 60 * 60 * 1000);
        int updated = assignmentRepo.markDueSoonZeroToTwo(now, in24th);

        if(updated > 0) log.info("임박 과제 일괄 갱신: {}건", updated);

        return updated;
    }
}
