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
    public ResponseEntity<AssignmentDto.AssignmentCreateResDto> createAssignment(@PathVariable Long subId, @RequestBody AssignmentDto.AssignmentCreateReqDto reqDto) {
        Assignment assignment = assignmentService.createAssignment(subId, reqDto);
        AssignmentDto.AssignmentCreateResDto assignmentDto = AssignmentDto.AssignmentCreateResDto.from(assignment);

        return ResponseEntity.ok(assignmentDto);
    }

    @PatchMapping("/{assignId}")
    @Operation(summary = "과제 수정"
            , description = "과제를 부분적 혹은 전체 수정합니다.<br>" +
            "Req : subId, {assignName, dueDate, category}<br>" +
            "Res : {assignId, assignName, dueDate, category, subName, isComplete}")
    public ResponseEntity<AssignmentDto.AssignmentUpdateResDto> updateAssignment(@PathVariable Long assignId, @RequestBody AssignmentDto.AssignmentUpdateReqDto reqDto) {
        Assignment assignment = assignmentService.updateAssignment(assignId, reqDto);
        AssignmentDto.AssignmentUpdateResDto assignmentDto = AssignmentDto.AssignmentUpdateResDto.from(assignment);

        return ResponseEntity.ok(assignmentDto);
    }

    @DeleteMapping("/{assignId}")
    @Operation(summary = "과제 삭제"
            , description = "과제를 삭제하며 없는 과제면 예외 메세지를 반환합니다.<br>" +
            "Req : assignId<br>" +
            "Res : ")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long assignId) {
        assignmentService.deleteAssignment(assignId);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{assignId}/complete")
    @Operation(summary = "과제 완료 상태 변경"
            , description = "버튼을 누를 시 과제 완료에 대한 상태가 변경되며 마감일이 하루 남은 과제는 2로 표현됩니다.<br>" +
            "Req : assignId, {isComplete}<br>" +
            "Res : <assignId, isComplete, dueDate}")
    public ResponseEntity<AssignmentDto.AssignmentStateUpdateResDto> changeComplete(
            @PathVariable Long assignId,
            @RequestBody AssignmentDto.AssignmentStateUpdateReqDto reqDto) {
        Assignment updatedAssign = assignmentService.updateCompleteState(assignId, reqDto.getIsComplete());

        return ResponseEntity.ok(AssignmentDto.AssignmentStateUpdateResDto.from(updatedAssign));
    }
}
