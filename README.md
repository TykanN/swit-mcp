```
  ░██████╗░██╗░░░░░░░██╗██╗████████╗  ███╗░░░███╗░█████╗░██████╗░
  ██╔════╝░██║░░██╗░░██║██║╚══██╔══╝  ████╗░████║██╔══██╗██╔══██╗
  ╚█████╗░░╚██╗████╗██╔╝██║░░░██║░░░  ██╔████╔██║██║░░╚═╝██████╔╝
  ░╚═══██╗░░████╔═████║░██║░░░██║░░░  ██║╚██╔╝██║██║░░██╗██╔═══╝░
  ██████╔╝░░╚██╔╝░╚██╔╝░██║░░░██║░░░  ██║░╚═╝░██║╚█████╔╝██║░░░░░
  ╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░  ╚═╝░░░░░╚═╝░╚════╝░╚═╝░░░░░
```

<div align="center">
  <strong>🟦 Swit 협업툴과 연동하는 Model Context Protocol (MCP) 서버 🟧</strong>
  <br>
  <em>🟩 Swit을 연결하여 업무 자동화를 실현하세요 🟩</em>
</div>

## 🚀 빠른 시작

NPM을 통해 즉시 사용 가능합니다:

```bash
npx -y swit-mcp
```

## 설정

### OAuth 인증 (권장)

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

### Bearer Token 인증 (fallback)

```bash
export SWIT_API_TOKEN="your-swit-api-token"
export SWIT_API_BASE_URL="https://openapi.swit.io/v1"  # 선택사항
```

## 사용법

### MCP 클라이언트 설정

Claude Desktop이나 다른 MCP 클라이언트의 설정 파일에 추가:

#### OAuth 방식 (권장)

```json
{
  "mcpServers": {
    "swit": {
      "command": "npx",
      "args": ["-y", "swit-mcp"],
      "env": {
        "SWIT_CLIENT_ID": "your-client-id",
        "SWIT_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

#### Bearer Token 방식 (대체)

```json
{
  "mcpServers": {
    "swit": {
      "command": "npx",
      "args": ["-y", "swit-mcp"],
      "env": {
        "SWIT_API_TOKEN": "your-swit-api-token"
      }
    }
  }
}
```

## OAuth 인증 과정

1. MCP 서버 실행 시 OAuth 웹서버가 자동으로 시작됩니다
2. `swit-oauth-start` 도구를 실행하여 인증 URL을 받습니다
3. 브라우저에서 해당 URL로 이동하여 Swit 계정으로 로그인합니다
4. 인증 완료 후 자동으로 토큰이 저장됩니다
5. `swit-oauth-status` 도구로 인증 상태를 확인할 수 있습니다

## 🛠️ 사용 가능한 도구

### 🔐 OAuth 관리
- **`swit-oauth-status`** - OAuth 인증 상태 확인 및 토큰 정보 조회
- **`swit-oauth-start`** - OAuth 인증 시작 (브라우저 인증 URL 반환)

### 💼 Swit API 연동
- **`swit-workspace-list`** - 접근 가능한 워크스페이스 목록 조회
- **`swit-channel-list`** - 지정된 워크스페이스의 채널 목록 조회 (필터링 지원)
- **`swit-message-create`** - 채널에 새 메시지 전송 (텍스트/HTML 지원)
- **`swit-message-comment-create`** - 기존 메시지에 댓글 작성

> 🎯 **활용 예시**: Claude에게 "Swit의 개발팀 채널에 프로젝트 진행 상황을 알려줘"라고 요청하면 자동으로 메시지를 전송할 수 있습니다.

## 개발

```bash
# 의존성 설치
pnpm install

# 개발 모드 실행
pnpm run dev

# 빌드
pnpm run build

# 테스트
pnpm test

# CLI 인증 (독립 실행용)
pnpm run auth
```

## 기술 스택

- **MCP SDK**: Model Context Protocol TypeScript SDK
- **OAuth**: @swit-api/oauth 패키지 사용
- **Type Safety**: Zod를 활용한 런타임 타입 검증
- **Web Server**: OAuth 콜백 처리를 위한 Express 내장 웹서버
- **Testing**: Jest + Nock을 활용한 HTTP mocking 테스트
