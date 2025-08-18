package com.toy.subkeeper.semester.service;

import com.toy.subkeeper.DTO.SemesterDto;
import com.toy.subkeeper.exception.DuplicateSemNameException;
import com.toy.subkeeper.semester.domain.Semester;
import com.toy.subkeeper.semester.repo.SemesterRepo;
import com.toy.subkeeper.user.domain.User;
import com.toy.subkeeper.user.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor

public class SemesterService {
    private final SemesterRepo semesterRepo;
    private final UserRepo userRepo;

    // 학기 생성
    public Semester createSemester(Long userId, SemesterDto.SemesterCreateReqDto semCreateReqDto) {
        String semName = semCreateReqDto.getSemName().trim(); // 공백 제거

        // 이미 있는 학기 이름일 경우
        if(semesterRepo.existsBySemName(semName)) {
            log.info("존재하는 학기 이름: {})", semName);

            throw new DuplicateSemNameException("이미 존재하는 학기입니다. : " + semName);
        }
        
        // userId 조회
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 새로운 학기 생성
        Semester semester = new Semester(
                semCreateReqDto.getSemName(),
                user
        );
        semesterRepo.save(semester);

        log.info("학기 생성: {} (id= {})", semester.getSemName(), semester.getId());

        return semester;
    }

    // 학기 삭제
    @Transactional
    public void deleteSemester(Long semId){
        Semester semester = semesterRepo.findById(semId)
                .orElseThrow(() -> new RuntimeException("학기를 찾을 수 없습니다."));

        log.info("학기 삭제: (id= {})", semester.getId());

        semesterRepo.delete(semester);
    }
}
