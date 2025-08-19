package com.toy.subkeeper;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 매일 자정에 과제 완료 상태를 갱신하기 위함
public class SubkeeperApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubkeeperApplication.class, args);
    }

}
