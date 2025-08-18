package com.toy.subkeeper.subject.controller;

import com.toy.subkeeper.DTO.SubjectDto;
import com.toy.subkeeper.exception.DuplicateSubNameException;
import com.toy.subkeeper.subject.domain.Subject;
import com.toy.subkeeper.subject.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/subject")

public class SubjectController {
    private final SubjectService subjectService;

    @PostMapping("/{semId}")
    @Operation(summary = "과목 생성"
            , description = "새로운 과목을 생성하고 이미 존재하는 이름이면 예외 메세지를 반환합니다.<br>" +
            "Req : semId, {subName}<br>" +
            "Res : {subId, subName}")
    public ResponseEntity<?> createSubject(@PathVariable Long semId, @RequestBody SubjectDto.SubjectCreateReqDto reqDto) {
        try {
            Subject subject = subjectService.createSubject(semId, reqDto);
            SubjectDto.SubjectCreateResDto subjectDto = new SubjectDto.SubjectCreateResDto(subject.getId(), subject.getSubName());

            return ResponseEntity.ok(subjectDto);
        } catch (DuplicateSubNameException e){
            // 존재하는 과목 이름일 경우 예외 메세지
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    @DeleteMapping("/{subId}")
    @Operation(summary = "과목 삭제"
            , description = "과목을 삭제하며 없는 과목이면 예외 메세지를 반환합니다.<br>" +
            "Req : subId<br>" +
            "Res : ")
    public ResponseEntity<?> deleteSubject(@PathVariable Long subId) {
        subjectService.deleteSubject(subId);

        return ResponseEntity.ok().build();
    }
}
