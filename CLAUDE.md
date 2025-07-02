# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Swit MCP Server

Swit 협업툴과 연동하는 Model Context Protocol (MCP) 서버 프로젝트입니다.

## 필수 명령어

### 패키지 관리

**중요: 이 프로젝트는 PNPM을 사용합니다. npm 대신 pnpm을 사용하세요.**

```bash
pnpm install           # 의존성 설치
pnpm run build         # TypeScript를 dist/로 빌드
pnpm run dev           # 개발 서버 실행 (hot reload)
pnpm test              # 테스트 실행 (Jest + nock)
pnpm run test:watch    # 테스트 워치 모드
pnpm run lint          # ESLint 검증
pnpm run format        # Prettier 포맷팅
```

### 개발 테스트

```bash
pnpm test -- swit-client.test.ts    # 특정 테스트 파일 실행
pnpm test -- --coverage             # 커버리지 포함 테스트
```

## 핵심 아키텍처

### 다층 인증 시스템

**OAuth 2.0 플로우 (우선순위)**

- `OAuthSettings` - 환경 변수 검증 포함 설정 관리
- `OAuthManager` - `@swit-api/oauth` 라이브러리 사용한 핵심 OAuth 연산
- `OAuthWebServer` - OAuth 콜백 처리용 Express 서버 (기본 포트 3000)
- `TokenCache` - 파일 시스템 지속성 (`~/.swit-mcp-token.json`)
- `AuthHelper` - 고수준 인증 코디네이터

**Bearer Token 대체 방식**

- OAuth 실패 시 `SWIT_API_TOKEN` 환경변수 사용
- OAuth 초기화 실패 시 자동 대체

### MCP 통합 패턴

**서버 구조** (`src/index.ts`):

- 6개 MCP 도구: OAuth 관리 2개 + Swit API 연산 4개
- 모든 입출력에 대한 Zod 스키마 검증
- 원본 API 컨텍스트 포함 구조화된 에러 응답

**도구 카테고리**:

- OAuth: `swit-oauth-status`, `swit-oauth-start`
- API: `swit-workspace-list`, `swit-channel-list`, `swit-message-create`, `swit-message-comment-create`

### API 클라이언트 아키텍처

**SwitClient 패턴**:

- 토큰 주입용 request interceptor가 있는 Axios 기반
- 자동 OAuth 토큰 갱신 (만료 5분 전 버퍼)
- 에러 보존 - API 응답이 에러 컨텍스트에 포함
- OAuth와 대체 인증 간 깔끔한 분리

### 타입 안정성 시스템

**스키마 관리** (`src/schemas.ts`):

- OpenAPI 명세서(`specs/swit-main.yaml`)와 일치하는 Zod 스키마
- **중요**: OpenAPI 스펙이 스키마 구조의 Single Source of Truth
- 런타임 검증에서 완전한 TypeScript 타입 생성
- 페이지네이션, 필터링, 에러 응답 타이핑 포괄

## 중요한 구현 세부사항

### ES 모듈 설정

- **TypeScript 소스임에도 모든 import는 `.js` 확장자 사용 필수**
- 타겟: ES2022 with ES modules
- 빌드 출력: 선언 파일 포함 `dist/` 디렉토리

### 환경 변수 설정

```bash
# OAuth 인증 (권장)
SWIT_CLIENT_ID=your-client-id
SWIT_CLIENT_SECRET=your-client-secret
SWIT_REDIRECT_URI=http://localhost:3000/callback  # 선택사항
OAUTH_PORT=3000                                   # 선택사항

# 대체 인증
SWIT_API_TOKEN=your-bearer-token
SWIT_API_BASE_URL=https://openapi.swit.io/v1     # 선택사항
```

### OAuth 웹서버 생명주기

1. 설정 가능한 포트에서 Express 서버 초기화
2. 스코프와 함께 인증 URL 생성: `workspace:read`, `channel:read`, `message:write`, `message:read`
3. `/callback` 엔드포인트에서 콜백 처리
4. 토큰 지속성 및 자동 갱신 관리
5. 적절한 시그널 핸들링으로 우아한 종료

### 테스트 패턴

**HTTP 모킹 전략**:

- API 응답 시뮬레이션용 nock
- OpenAPI 호환 모크 응답 필수
- 에러 시나리오 커버리지 (401, 404, 429, 500, 네트워크 실패)
- 테스트 데이터는 실제 Swit API 필드명과 구조와 일치해야 함

**테스트 실행**:

- ts-jest 변환기와 함께 Jest
- 테스트 격리를 위한 `beforeEach/afterEach`의 `nock.cleanAll()`
- 포괄적인 OAuth 매니저 통합 테스트

## 개발 가이드라인

### 스키마 업데이트

- **항상** OpenAPI 스펙(`specs/swit-main.yaml`)에 대해 검증
- Zod 스키마 먼저 업데이트, 그 다음 테스트 모크 데이터
- 필드명은 snake_case 따름 (예: `user_id`, `channel_id`)
- 타임스탬프는 Unix 타임스탬프가 아닌 ISO 8601 형식 문자열 사용

### 에러 핸들링 전략

- 에러 컨텍스트에 원본 API 응답 보존
- winston으로 구조화된 로깅 (프로덕션에서 console.log 절대 금지)
- 인증 실패에 대한 우아한 대체 패턴
- 웹서버 종료를 위한 프로세스 정리

### 코드 품질 표준

- TypeScript strict 모드 활성화
- ESLint + Prettier 강제
- 명시적 `any` 타입 금지 (경고만)
- 포괄적인 에러 응답 타이핑

## API 문서

- [Swit Core API v1 문서](https://devdocs.swit.io/docs/core1/ref)
- **OpenAPI 스펙**: `specs/swit-main.yaml` - 공식 Swit API OpenAPI 스펙 문서

### Swit Core API v1 상세 참조

**Base URL**: `https://openapi.swit.io/v1`
**Authentication**: Bearer Token (OAuth 2.0)

#### 공통 사항

- 모든 요청에 `Authorization: Bearer {token}` 헤더 필요
- Pagination은 offset 기반 (기본 limit: 20, 최대: 100)
- 에러 응답: `{ error: { code: string, message: string } }`

## OAuth 인증 설정

### 방법 1: 내장 웹서버 사용 (권장)

1. **Swit Developer Console에서 앱 등록**
   - https://developers.swit.io 에서 새 앱 생성
   - 클라이언트 ID, 시크릿 발급
   - 리다이렉트 URI: `http://localhost:3000/callback` 설정

2. **환경변수 설정**

   ```bash
   export SWIT_CLIENT_ID="your-client-id"
   export SWIT_CLIENT_SECRET="your-client-secret"
   export OAUTH_PORT="3000"  # 선택사항
   ```

3. **MCP 서버 실행**

   ```bash
   pnpm run dev
   ```

4. **OAuth 인증**
   - MCP 클라이언트에서 `swit-oauth-start` 도구 실행
   - 반환된 URL을 브라우저에서 열어 인증 완료
   - 또는 직접 http://localhost:3000 에서 인증

5. **인증 상태 확인**
   - `swit-oauth-status` 도구로 인증 상태 확인

### 방법 2: CLI 인증 (독립 실행용)

```bash
pnpm run auth
```

## 아키텍처 의존성

**핵심 라이브러리**:

- `@modelcontextprotocol/sdk` - MCP 프로토콜 준수
- `@swit-api/oauth` - 공식 Swit OAuth 통합
- `axios` - 인터셉터 패턴 포함 HTTP 클라이언트
- `zod` - 런타임 검증 및 타입 생성

**개발 스택**:

- TypeScript 5.x with ES2022 target
- Jest + nock for testing
- Winston for structured logging
- Express for OAuth callback server

## OAuth 통합 참고사항

### 토큰 관리

- 만료 전 5분 버퍼로 자동 갱신
- 사용자 홈 디렉토리에 안전한 파일 기반 캐싱
- 적절한 에러 복구 및 재인증 플로우

### 웹서버 보안

- 포트 충돌 감지 및 우아한 처리
- 실패한 인증에 대한 에러 페이지 렌더링
- 적절한 CORS 및 보안 헤더 설정

### API 통합

- 토큰 주입을 위한 request interceptor 패턴
- 포괄적인 에러 컨텍스트 보존
- 페이지네이션 및 필터링 매개변수 처리

## 마이그레이션 고려사항

**API 진화**: 현재 Swit Core API v1 사용. 아키텍처는 클라이언트 인터페이스 최소 변경으로 v2 마이그레이션 지원.

**스키마 정렬**: API 계약 준수를 유지하기 위해 항상 OpenAPI 명세서에 대해 스키마 변경 검증.

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
