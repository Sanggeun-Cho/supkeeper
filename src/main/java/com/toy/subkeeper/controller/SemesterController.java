package com.toy.subkeeper.controller;

import com.toy.subkeeper.DTO.CalendarDto;
import com.toy.subkeeper.DTO.DashboardDto;
import com.toy.subkeeper.DTO.SemesterDto;
import com.toy.subkeeper.exception.DuplicateSemNameException;
import com.toy.subkeeper.domain.Semester;
import com.toy.subkeeper.service.SemesterService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/semester")

public class SemesterController {
    private final SemesterService semesterService;

    @PostMapping
    @Operation(summary = "학기 생성"
            , description = "새로운 학기를 생성하고 이미 존재하는 이름이면 예외 메세지를 반환합니다.<br>" +
            "Req : userId(Header: 'X-USER-ID'), {semName}<br>" +
            "Res : {semId, semName}")
    public ResponseEntity<SemesterDto.SemesterCreateResDto> createSemester(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestBody SemesterDto.SemesterCreateReqDto reqDto
    ) {
            Semester semester = semesterService.createSemester(userId, reqDto);
            SemesterDto.SemesterCreateResDto semesterDto = new SemesterDto.SemesterCreateResDto(semester.getId(), semester.getSemName());

            return ResponseEntity.ok(semesterDto);
    }

    @DeleteMapping("/{semId}")
    @Operation(summary = "학기 삭제"
            , description = "학기를 삭제하며 없는 학기면 예외 메세지를 반환합니다.<br>" +
            "Req : semId<br>" +
            "Res : ")
    public ResponseEntity<Void> deleteSemester(@PathVariable Long semId){
        semesterService.deleteSemester(semId);

        return ResponseEntity.ok().build();
    }

    // 대시보드 조회
    @GetMapping("/{semId}/dashboard")
    @Operation(summary = "대시보드 조회"
            , description = "대시보드에 대한 모든 정보를 넘깁니다.<br>" +
            "Req : userId(Header: 'X-USER-ID'), semId<br>" +
            "Res : Dto 참조")
    public ResponseEntity<DashboardDto.DashboardViewDto> getDashboardView(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long semId,
            @RequestParam(name = "subId", required = false) Long subId,
            @RequestParam(name = "categories", required = false) List<Integer> categories
            ) {
        DashboardDto.DashboardViewDto res = semesterService.getDashboardView(userId, semId, subId, categories);
        return ResponseEntity.ok(res);
    }

    // 달력 조회
    @GetMapping("/{semId}/calendar")
    @Operation(summary = "달력 조회"
            , description = "학기에 해당하는 달력에 대한 모든 정보를 넘깁니다.<br>" +
            "Res : semId<br>" +
            "Req : {userName, <List>{subName, dueDate, assignName, category}}")
    public ResponseEntity<CalendarDto.CalendarItemList> getCalendarItems(@PathVariable Long semId){
        return ResponseEntity.ok(semesterService.getCalendarItems(semId));
    }
}
