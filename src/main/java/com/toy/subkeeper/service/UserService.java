package com.toy.subkeeper.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.toy.subkeeper.DTO.UserDto;
import com.toy.subkeeper.repository.SemesterRepo;
import com.toy.subkeeper.domain.User;
import com.toy.subkeeper.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor

public class UserService {
    private final UserRepo userRepo;
    private final SemesterRepo semesterRepo;

    @Value("${google.client.id}")
    private String googleClientId;

    @Transactional
    public User loginOrSignUp(String idTokenString) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if(idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");

                return userRepo.findByEmail(email)
                        .orElseGet(() -> {
                            log.info("새로운 유저 생성 : {} ({})", name, email);
                            return userRepo.save(new User(email, name));
                        });
            } else {
                throw new IllegalArgumentException(("유효하지 않은 ID 토큰입니다."));
            }
        } catch (Exception e) {
            log.error("구글 로그인 실패", e);
            throw new IllegalArgumentException("구글 로그인 처리 중 오류 발생");
        }
    }

    public Long findLastSemId(Long userId){
        return semesterRepo.findTopByUser_IdOrderByIdDesc(userId)
                .map(s -> s.getId())
                .orElse(null);
    }
}
