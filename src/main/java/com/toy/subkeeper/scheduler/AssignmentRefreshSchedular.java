package com.toy.subkeeper.scheduler;

import com.toy.subkeeper.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j

// 서울 기준
public class AssignmentRefreshSchedular {
    private final AssignmentService assignmentService;

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void refreshDailyAtMidnightKST(){
        log.info("과제 완료 상태 갱신 스케쥴러 실행");
        assignmentService.refreshZeroToTwoForDueSoon();
    }
}
