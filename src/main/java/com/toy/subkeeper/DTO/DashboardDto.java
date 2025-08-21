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

            // 화면에 표시할 날짜
            private String dueLabel;
        }
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public class DashboardViewDto {
        private DashboardDtoBuilder dashboard;
        private List<SemesterMenuItemDto> semesters;
        private AssignmentSections sections;

        @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
        public class SemesterMenuItemDto {
            private Long semId;
            private String semName;

            private boolean current; // 현재 선택된 학기인가
        }

        @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
        public class AssignmentSections {
            private List<DashboardDtoBuilder.AssignmentListDto> incomplete;
            private List<DashboardDtoBuilder.AssignmentListDto> complete;
        }
    }




}
