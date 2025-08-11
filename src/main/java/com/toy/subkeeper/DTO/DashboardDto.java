package com.toy.subkeeper.DTO;

import lombok.*;

import java.util.Date;
import java.util.List;

public class DashboardDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardDtoBuilder {
        private Long userId;
        private String userName;

        private Long semId;
        private String semName;

        private List<SubjectListDto> subjectList;
        private List<AssignmentListDto> assignmentList;

        @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
        public static class SubjectListDto{
            private Long subId;
            private String subName;
        }

        @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
        public static class AssignmentListDto{
            private Long assignId;
            private String assignName;
            private Date dueDate;
            private int category;
            private int isComplete;
        }
    }
}
