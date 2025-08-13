package com.toy.subkeeper.semester.controller;

import com.toy.subkeeper.DTO.SemesterDto;
import com.toy.subkeeper.exception.DuplicateSemNameException;
import com.toy.subkeeper.semester.domain.Semester;
import com.toy.subkeeper.semester.service.SemesterService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> createSemsester(
            @RequestHeader("X-USER-ID") Long userId,
            @RequestBody SemesterDto.SemesterCreateReqDto reqDto
    ) {
        try{
            Semester semester = semesterService.createSemester(userId, reqDto);
            SemesterDto.SemesterCreateResDto semesterDto = new SemesterDto.SemesterCreateResDto(semester.getId(), semester.getSemName());

            return ResponseEntity.ok(semesterDto);
        } catch (DuplicateSemNameException e){
            // 존재하는 학기 이름일 경우 예외 메세지
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }
}
