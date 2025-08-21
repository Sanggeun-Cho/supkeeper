package com.toy.subkeeper.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.toy.subkeeper.assignment.domain.Assignment;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.Date;

public class AssignmentDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentCreateReqDto {
        @NotBlank(message = "과제명 필수")
        @Size(max = 50)
        private String assignName;

        @NotNull(message = "마감일시 필수")
        @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
        private Date dueDate;

        @NotNull(message = "카테고리 필수")
        @Min(0)
        @Max(2)
        private int category;

        @NotNull(message = "과목 ID 필수")
        private Long subId;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentCreateResDto {
        private Long assignId;
        private String assignName;
        private Date dueDate;
        private int category;
        private Long subId;
        private String subName;
        private int isComplete;

        public static AssignmentCreateResDto from(Assignment assignment) {
            return AssignmentCreateResDto.builder()
                    .assignId(assignment.getId())
                    .assignName(assignment.getAssignName())
                    .dueDate(assignment.getDueDate())
                    .category(assignment.getCategory())
                    .subId(assignment.getSubject().getId())
                    .subName(assignment.getSubject().getSubName())
                    .isComplete(assignment.getIsComplete())
                    .build();
        } // subName 을 꺼내기 위함
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentUpdateReqDto {
        @NotBlank(message = "과제명 필수")
        @Size(max = 100, message = "과제명 150자 이하 입력")
        private String assignName;

        @NotNull(message = "마감일시 필수")
        @JsonFormat(pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
        private Date dueDate;

        @NotNull(message = "카테고리 필수")
        @Min(0)
        @Max(2)
        private int category;

        @NotNull(message = "과목 ID 필수")
        private Long subId;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentUpdateResDto {
        private String assignName;
        private Date dueDate;
        private Integer category;
        private Long subId;
        private String subName;
        private int isComplete;

        public static AssignmentUpdateResDto from(Assignment assignment) {
            return AssignmentUpdateResDto.builder()
                    .assignName(assignment.getAssignName())
                    .dueDate(assignment.getDueDate())
                    .category(assignment.getCategory())
                    .subId(assignment.getSubject().getId())
                    .subName(assignment.getSubject().getSubName())
                    .isComplete(assignment.getIsComplete())
                    .build();
        } // subName 을 꺼내기 위함
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentStateUpdateReqDto{
        @NotNull(message = "과제 완료 상태 값 필수")
        @Min(0)
        @Max(1)
        private int isComplete;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentStateUpdateResDto {
        private Long assignId;
        private int isComplete;
        private Date dueDate;

        public static AssignmentStateUpdateResDto from(Assignment assignment){
            return AssignmentStateUpdateResDto.builder()
                    .assignId(assignment.getId())
                    .isComplete(assignment.getIsComplete())
                    .dueDate(assignment.getDueDate())
                    .build();
        }
    }
}
