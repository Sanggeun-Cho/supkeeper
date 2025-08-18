package com.toy.subkeeper.assignment.controller;

import com.toy.subkeeper.DTO.AssignmentDto;
import com.toy.subkeeper.assignment.domain.Assignment;
import com.toy.subkeeper.assignment.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/assignment")

public class AssignmentController {
    private final AssignmentService assignmentService;

    @PostMapping("/subject/{subId}")
    @Operation(summary = "과제 생성"
            , description = "새로운 과제를 생성합니다.<br>" +
            "Req : subId, {assignName, dueDate, category}<br>" +
            "Res : {assignId, assignName, dueDate, category, subName, isComplete}")
    public ResponseEntity<?> createAssignment(@PathVariable Long subId, @RequestBody AssignmentDto.AssignmentCreateReqDto reqDto) {
        Assignment assignment = assignmentService.createAssignment(subId, reqDto);
        AssignmentDto.AssignmentCreateResDto assignmentDto = AssignmentDto.AssignmentCreateResDto.from(assignment);

        return ResponseEntity.ok(assignmentDto);
    }

    @PatchMapping("/{assignId}")
    @Operation(summary = "과제 수정"
            , description = "과제를 부분적 혹은 전체 수정합니다.<br>" +
            "Req : subId, {assignName, dueDate, category}<br>" +
            "Res : {assignId, assignName, dueDate, category, subName, isComplete}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long assignId, @RequestBody AssignmentDto.AssignmentUpdateReqDto reqDto) {
        Assignment assignment = assignmentService.updateAssignment(assignId, reqDto);
        AssignmentDto.AssignmentUpdateResDto assignmentDto = AssignmentDto.AssignmentUpdateResDto.from(assignment);

        return ResponseEntity.ok(assignmentDto);
    }

    @DeleteMapping("/{assignId}")
    @Operation(summary = "과제 삭제"
            , description = "과제를 삭제하며 없는 과제면 예외 메세지를 반환합니다.<br>" +
            "Req : assignId<br>" +
            "Res : ")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long assignId) {
        assignmentService.deleteAssignment(assignId);

        return ResponseEntity.ok().build();
    }
}
