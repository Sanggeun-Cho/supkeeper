package com.toy.subkeeper.DTO;

import lombok.*;

import java.util.Date;
import java.util.List;

public class CalendarDto {
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CalendarItem {
        private String subName;
        private Date dueDate;
        private String assignName;
        private int category;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CalendarItemList {
        private String userName;
        private List<CalendarItem> items;
    }
}
