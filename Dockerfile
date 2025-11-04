# ---------- 1) React 빌드 ----------
FROM node:20 AS web
WORKDIR /app/frontend
# 의존성 먼저
COPY frontend/package*.json ./
RUN npm ci
# 소스 복사 후 빌드
COPY frontend/ ./
RUN npm run build

# ---------- 2) Spring Boot 빌드 (Gradle) ----------
FROM gradle:8.9-jdk21 AS build
WORKDIR /app
# 전체 소스 복사
COPY . .
# 프런트 산출물을 Spring 정적 리소스로 포함
RUN rm -rf src/main/resources/static && mkdir -p src/main/resources/static
COPY --from=web /app/frontend/dist/ src/main/resources/static/
# 테스트 생략하고 부트 JAR 빌드
RUN gradle bootJar -x test

# ---------- 3) 런타임 이미지 ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
# Railway가 할당하는 포트 (중요)
ENV PORT=8080
# 빌드 산출물 복사
COPY --from=build /app/build/libs/*.jar /app/app.jar
# Railway의 $PORT로 바인딩해서 실행
CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]
