package com.toy.subkeeper.DTO;

import lombok.*;

import java.util.Date;
import java.util.List;

public class CalendarDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CalendarListDto {
        private Long userName;
        private List<SubjectListDto> subjectList;
        private List<AssignmentListDto> assignmentList;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectListDto {
        private String subName;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentListDto {
        private String assignName;
        private Date dueDate;
        private Long subId;
        private int category;
    }
}
