# 2359 📝✨
<p align="center">
  <img src="outLogo.png" alt="2359 Logo" width="70"/>
</p>

<p align="center">
  <b>🚀 학기별 과제를 쉽고 체계적으로 관리할 수 있는 스마트 과제 매니저</b><br/>
  <sub>템플릿 기반 기록, 달력 뷰, 완료/미완료 구분까지 한 번에!</sub>
</p>

---

## 🌟 프로젝트 소개
**2359**는 대학생과 학습자를 위해 설계된 **과제 관리 플랫폼**입니다.  
과제와 할 일을 단순히 나열하는 것이 아니라 **블록 형태**로 기록하고,  
**과목 태그, 학기별 관리, 캘린더 뷰**를 통해 한눈에 확인할 수 있습니다.

> 이름만 입력하면 나만의 공간이 열리고, 완료/미완료 구분과 마감일 알림으로  
> 더 이상 마감일을 놓치지 않게 도와줍니다!

---

## ✨ 주요 기능

### 🔑 Login
- 이름만 입력해도 나만의 워크스페이스 생성
- (추후) 패스워드 및 보안 기능 추가 예정

### 📚 Dashboard
- **Semester**: 학기 추가/삭제, 학기별 과제 관리
- **Subject**: 과목 추가/삭제 및 태깅
- **Assignment**:
    - 과제 추가, 수정, 삭제
    - 카테고리, 과목, 마감일, 이름 설정
    - 완료/미완료 버튼 토글
    - 마감 임박 알림 (D-1, D-Day)
- **Calendar**: 월별 일정을 한눈에 확인

---

## 🛠 기술 스택

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white&style=for-the-badge"/>
  <!-- Backend -->
  <img src="https://img.shields.io/badge/Backend-SpringBoot-6DB33F?logo=springboot&logoColor=white&style=for-the-badge"/>
  <!-- Database -->
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white&style=for-the-badge"/>
  <!-- Tools -->
  <img src="https://img.shields.io/badge/VersionControl-Git-F05032?logo=git&logoColor=white&style=for-the-badge"/>
  <img src="https://img.shields.io/badge/IDE-IntelliJ%20IDEA-000000?logo=intellijidea&logoColor=white&style=for-the-badge"/>
</p>

---

## 🚀 시작하기

### 1. 클론하기
```bash
git clone https://github.com/your-username/2359.git
cd 2359
```

### 2. 데이터베이스 설정

MySQL에 데이터베이스 생성:

```
CREATE DATABASE assignment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
### 3. application.yaml 설정

backend/src/main/resources/application.yaml 파일을 열고 DB 연결 정보를 입력:
```
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/assignment_db
    username: your_username
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL8Dialect
```

### 4. 백엔드 실행
```
cd backend
./gradlew bootRun
```

### 5. 프론트엔드 실행
```
cd frontend
npm install
npm run dev
```


서버가 정상적으로 동작하면 http://localhost:3000
 에서 접속 가능합니다.

---