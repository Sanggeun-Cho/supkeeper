package com.toy.subkeeper.semester.service;

import com.toy.subkeeper.DTO.CalendarDto;
import com.toy.subkeeper.DTO.DashboardDto;
import com.toy.subkeeper.DTO.SemesterDto;
import com.toy.subkeeper.assignment.domain.Assignment;
import com.toy.subkeeper.assignment.repo.AssignmentRepo;
import com.toy.subkeeper.exception.DuplicateSemNameException;
import com.toy.subkeeper.semester.domain.Semester;
import com.toy.subkeeper.semester.repo.SemesterRepo;
import com.toy.subkeeper.subject.domain.Subject;
import com.toy.subkeeper.subject.repo.SubjectRepo;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor

public class SemesterService {
    private final SemesterRepo semesterRepo;
    private final UserRepo userRepo;
    private final SubjectRepo subjectRepo;
    private final AssignmentRepo assignmentRepo;

    // 학기 생성
    public Semester createSemester(Long userId, SemesterDto.SemesterCreateReqDto semCreateReqDto) {
        String semName = semCreateReqDto.getSemName().trim(); // 공백 제거

        // 이미 있는 학기 이름일 경우
        if(semesterRepo.existsBySemName(semName)) {
            log.info("존재하는 학기 이름: {})", semName);

            throw new DuplicateSemNameException("이미 존재하는 학기입니다. : " + semName);
        }
        
        // userId 조회
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 새로운 학기 생성
        Semester semester = new Semester(
                semCreateReqDto.getSemName(),
                user
        );
        semesterRepo.save(semester);

        log.info("학기 생성: {} (id= {})", semester.getSemName(), semester.getId());

        return semester;
    }

    // 학기 삭제
    @Transactional
    public void deleteSemester(Long semId){
        Semester semester = semesterRepo.findById(semId)
                .orElseThrow(() -> new RuntimeException("학기를 찾을 수 없습니다."));

        log.info("학기 삭제: (id= {})", semester.getId());

        semesterRepo.delete(semester);
    }

    // 대시보드 이동
    @Transactional(readOnly = true)
    public DashboardDto.DashboardViewDto getDashboardView(Long userId, Long semIdNullable) {
        // 유저의 모든 학기 조회
        List<Semester> allSemesters = semesterRepo.findByUser_IdOrderByIdDesc(userId);
        if(allSemesters.isEmpty()) {
            throw new IllegalArgumentException("해당 사용자의 학기가 없습니다.");
        }

        // 사용할 semId 결정 (기본은 가장 최신 학기)
        Long semId = (semIdNullable != null)
                ? semIdNullable
                : semesterRepo.findTopByUser_IdOrderByIdDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException("최신 학기를 찾을 수 없습니다."))
                .getId();

        // 사이드 제외 대시보드
        DashboardDto.DashboardDtoBuilder dashboard = buildDashboard(semId);

        // 사이드 바
        List<DashboardDto.DashboardViewDto.SemesterMenuItemDto> menu = allSemesters.stream()
                .map(s -> DashboardDto.DashboardViewDto.SemesterMenuItemDto.builder()
                        .semId(s.getId())
                        .semName(s.getSemName())
                        .current(s.getId().equals(semId))
                        .build())
                .toList();

        // 과제 칸, 모두 최신순으로 정렬
        List<Assignment> all = assignmentRepo.findAllBySemesterIdOrderByDueDateDesc(semId);

        List<DashboardDto.DashboardDtoBuilder.AssignmentListDto> incompleteDtos = all.stream()
                .filter(a -> a.getIsComplete() != 1)     // 0: 미완료, 2: 하루 남은 과제
                .map(this::toAssignmentDto)
                .toList();

        List<DashboardDto.DashboardDtoBuilder.AssignmentListDto> completeDtos = all.stream()
                .filter(a -> a.getIsComplete() == 1)     // 1: 완료
                .map(this::toAssignmentDto)
                .toList();

        DashboardDto.DashboardViewDto.AssignmentSections sections = DashboardDto.DashboardViewDto.AssignmentSections.builder()
                .incomplete(incompleteDtos)
                .complete(completeDtos)
                .build();

        return DashboardDto.DashboardViewDto.builder()
                .dashboard(dashboard)
                .semesters(menu)
                .sections(sections)
                .build();
    }

    // 달력
    @Transactional(readOnly = true)
    public CalendarDto.CalendarItemList getCalendarItems(Long semId) {
        // 학기 사용자 관계
        Semester sem = semesterRepo.findByIdWithUser(semId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학기입니다."));

        // 과제를 마감일 순으로 정렬
        List<Assignment> assignments = assignmentRepo.findAllBySemesterIdOrderByDueDate(semId);

        // 객체 만들기
        List<CalendarDto.CalendarItem> items = assignments.stream()
                .map(a -> CalendarDto.CalendarItem.builder()
                        .subName(a.getSubject().getSubName())
                        .dueDate(a.getDueDate())
                        .assignName(a.getAssignName())
                        .category(a.getCategory())
                        .build())
                .toList();

        return CalendarDto.CalendarItemList.builder()
                .userName(sem.getUser().getUserName())
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDto.DashboardDtoBuilder buildDashboard(Long semId) {
        // 학기와 사용자 관계
        Semester sem = semesterRepo.findByIdWithUser(semId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학기입니다."));

        // 과목 리스트 가져오기
        List<Subject> subjects = subjectRepo.findBySemester_Id(semId);

        // 과목
        List<DashboardDto.DashboardDtoBuilder.SubjectListDto> subjectList = subjects.stream()
                .map(s -> DashboardDto.DashboardDtoBuilder.SubjectListDto.builder()
                        .subId(s.getId())
                        .subName(s.getSubName())
                        .build())
                .toList();

        return DashboardDto.DashboardDtoBuilder.builder()
                .userId(sem.getUser().getId())
                .userName(sem.getUser().getUserName())
                .semId(sem.getId())
                .semName(sem.getSemName())
                .subjectList(subjectList)
                .build();
    }

    // 과제 DTO에 대한 Mapping Helper
    private DashboardDto.DashboardDtoBuilder.AssignmentListDto toAssignmentDto(Assignment assignment) {
        return DashboardDto.DashboardDtoBuilder.AssignmentListDto.builder()
                .assignId(assignment.getId())
                .assignName(assignment.getAssignName())
                .dueDate(assignment.getDueDate())
                .category(assignment.getCategory())
                .isComplete(assignment.getIsComplete())
                .dueLabel(formatDueLabelKST(assignment.getDueDate()))
                .build();
    }

    // Chat GPT 로직
    // 해당 날짜를 'AUG 21st' 등으로 표기하여 그대로 넘겨줌
    private String formatDueLabelKST(Date dueDate) {
        if (dueDate == null) return null;
        var zone = java.time.ZoneId.of("Asia/Seoul");
        var zdt  = java.time.Instant.ofEpochMilli(dueDate.getTime()).atZone(zone);

        int day = zdt.getDayOfMonth();
        String suffix = ordinalSuffix(day); // st/nd/rd/th
        // "AUG" 같은 영문 약어 대문자
        String mon = zdt.getMonth()
                .getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                .toUpperCase();

        return mon + " " + day + suffix; // 예: "AUG 21st"
    }

    private String ordinalSuffix(int day) {
        // 11,12,13은 예외적으로 th
        if (day >= 11 && day <= 13) return "th";
        return switch (day % 10) {
            case 1 -> "st";
            case 2 -> "nd";
            case 3 -> "rd";
            default -> "th";
        };
    }
}
