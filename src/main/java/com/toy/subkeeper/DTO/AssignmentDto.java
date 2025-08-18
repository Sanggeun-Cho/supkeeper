package com.toy.subkeeper.DTO;

import com.toy.subkeeper.assignment.domain.Assignment;
import lombok.*;

import java.util.Date;

public class AssignmentDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentCreateReqDto {
        private String assignName;
        private Date dueDate;
        private int category;
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
        private String assignName;
        private Date dueDate;
        private Integer category;
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

}
