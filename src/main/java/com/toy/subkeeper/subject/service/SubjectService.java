package com.toy.subkeeper.subject.service;

import com.toy.subkeeper.DTO.SubjectDto;
import com.toy.subkeeper.exception.DuplicateSubNameException;
import com.toy.subkeeper.semester.domain.Semester;
import com.toy.subkeeper.semester.repo.SemesterRepo;
import com.toy.subkeeper.subject.domain.Subject;
import com.toy.subkeeper.subject.repo.SubjectRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor

public class SubjectService {
    private final SubjectRepo subjectRepo;
    private final SemesterRepo semesterRepo;

    // 과목 생성
    public Subject createSubject(Long semId, SubjectDto.SubjectCreateReqDto subjectCreateReqDto) {
        String subName = subjectCreateReqDto.getSubName().trim(); // 공백 제거

        // 이미 있는 과목 이름일 경우
        if (subjectRepo.existsBySemester_SemIdAndSubName(semId, subName)) {
            log.info("동일 학기({})에 이미 존재하는 과목 이름: {}", semId, subName);

            throw new DuplicateSubNameException("동일 학기 내 이미 존재하는 과목입니다: " + subName);
        }

        // semId 조회
        Semester semester = semesterRepo.findById(semId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학기입니다."));

        // 새로운 과목 생성
        Subject subject = new Subject(
                subjectCreateReqDto.getSubName(),
                semester
        );
        subjectRepo.save(subject);

        log.info("과목 생성: {} (id = {})", subject.getSubName(), subject.getId());

        return subject;
    }

    // 과목 삭제
    @Transactional
    public void deleteSubject(Long subId) {
        Subject subject = subjectRepo.findById(subId)
                        .orElseThrow(() -> new RuntimeException("과목을 찾을 수 없습니다."));

        log.info("과목 삭제: (id = {})", subId);

        subjectRepo.deleteById(subId);
    }
}
