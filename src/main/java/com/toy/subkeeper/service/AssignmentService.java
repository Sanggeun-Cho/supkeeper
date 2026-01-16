package com.toy.subkeeper.service;

import com.toy.subkeeper.DTO.AssignmentDto;
import com.toy.subkeeper.domain.Assignment;
import com.toy.subkeeper.repository.AssignmentRepo;
import com.toy.subkeeper.domain.Subject;
import com.toy.subkeeper.repository.SubjectRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.spel.ast.Assign;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
        assignment.setCategory(reqDto.getCategory());

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
     * 요청이 0이고 마감 48시간 이내면 2 (마감 임박 상태)
     * 그 외는 0 (미완료 상태)
     */
    @Transactional
    public Assignment updateCompleteState(Long assignmentId, Integer state){
        Assignment a = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과제입니다."));

        int base = (state != null && state == 1) ? 1 : 0; // 1이면 완료 고정
        if (base == 0 && isDueWithin48HoursFromEod(a.getDueDate())) {
            a.setIsComplete(2); // 임박
        } else {
            a.setIsComplete(base); // 미완료 또는 완료
        }
        log.info("과제 완료상태 변경: id={}, isComplete={}", assignmentId, a.getIsComplete());
        return a;
    }

    private boolean isDueWithin48HoursFromEod(Date due){
        if (due == null) return false;
        Date dueEod = endOfDay(due);
        long now = System.currentTimeMillis();
        long diff = dueEod.getTime() - now;
        return diff >= 0 && diff <= 48L * 60 * 60 * 1000; // 48h
    }

    // 자정에 과제 완료 상태 리프레시를 위한 함수
    @Transactional
    public int refreshZeroToTwoForDueSoon() {
        // (예시) 학기/기간 범위로 가져오거나, 미완료(0)인 모든 과제를 가져온 뒤 필터링
        var candidates = assignmentRepo.findAllByIsComplete(0); // 필요 시 repo 메소드 추가
        int updated = 0;
        for (Assignment a : candidates) {
            if (isDueWithin48HoursFromEod(a.getDueDate())) {
                a.setIsComplete(2);
                updated++;
            }
        }
        if(updated > 0) log.info("임박 과제 일괄 갱신(48h/EOD): {}건", updated);
        return updated;
    }

    // 23:59 를 구해주는
    private Date endOfDay(Date date) {
        if (date == null) return null;
        Instant dueInstant = date.toInstant();
        ZonedDateTime zdt = dueInstant.atZone(ZoneId.of("Asia/Seoul")); // 서버 TZ 명확화
        ZonedDateTime eod = zdt.withHour(23).withMinute(59).withSecond(59).withNano(999_000_000);
        return Date.from(eod.toInstant());
    }
}
