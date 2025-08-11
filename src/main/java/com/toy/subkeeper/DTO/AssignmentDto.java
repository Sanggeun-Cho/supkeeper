package com.toy.subkeeper.DTO;

import lombok.*;

import java.util.Date;

public class AssignmentDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentCreateDto {
        private String assignName;
        private Date dueDate;
        private int category;
        private Long subId;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignmentUpdateDto {
        private String assignName;
        private Date dueDate;
        private int category;
        private Long subId;
    }
}
