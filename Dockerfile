# ---------- 1) React 빌드 ----------
FROM node:20 AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2) Spring Boot 빌드 (Gradle) ----------
FROM gradle:8.9-jdk21 AS build
WORKDIR /app
COPY . .
# 프런트 산출물을 Spring 정적 리소스로 포함
RUN rm -rf src/main/resources/static && mkdir -p src/main/resources/static
COPY --from=web /app/frontend/dist/ src/main/resources/static/
# 테스트 생략하고 부트 JAR 빌드
RUN gradle bootJar -x test

# ---------- 3) 런타임 이미지 ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/app.jar
# Render는 포트를 직접 지정하지 않아도 웹 서비스가 트래픽을 라우팅합니다.
# 필요하면 환경변수 SERVER_PORT로 제어 가능 (아래 실행 커맨드에서 사용)
ENV SERVER_PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "java -Dserver.port=${SERVER_PORT} -jar /app/app.jar"]
