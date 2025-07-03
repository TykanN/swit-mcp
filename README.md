```
  ░██████╗░██╗░░░░░░░██╗██╗████████╗  ███╗░░░███╗░█████╗░██████╗░
  ██╔════╝░██║░░██╗░░██║██║╚══██╔══╝  ████╗░████║██╔══██╗██╔══██╗
  ╚█████╗░░╚██╗████╗██╔╝██║░░░██║░░░  ██╔████╔██║██║░░╚═╝██████╔╝
  ░╚═══██╗░░████╔═████║░██║░░░██║░░░  ██║╚██╔╝██║██║░░██╗██╔═══╝░
  ██████╔╝░░╚██╔╝░╚██╔╝░██║░░░██║░░░  ██║░╚═╝░██║╚█████╔╝██║░░░░░
  ╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░  ╚═╝░░░░░╚═╝░╚════╝░╚═╝░░░░░
```

<div align="center">
  <strong>🟦 Swit MCP( Model Context Protocol ) Server 🟧</strong>
</div>

## 🚀 설정 가이드

### 1. Swit Developer Console 앱 등록

1. https://developers.swit.io 에서 새 앱 생성
2. 클라이언트 ID, 시크릿 발급
3. 리다이렉트 URI: `http://localhost:3000/callback` 설정

### 2. MCP 클라이언트 설정

#### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### 3. 인증 과정

1. Claude Desktop에서 첫 Swit 도구 실행 시 OAuth 웹서버가 자동 시작
2. `swit-oauth-start` 도구 실행하여 인증 URL 획득
3. 브라우저에서 Swit 계정으로 로그인
4. 토큰이 자동으로 저장되며 `swit-oauth-status`로 확인 가능

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

## 기술 스택

- **MCP SDK**: Model Context Protocol TypeScript SDK
- **OAuth**: @swit-api/oauth 패키지 사용
- **Type Safety**: Zod를 활용한 런타임 타입 검증
- **Web Server**: OAuth 콜백 처리를 위한 Express 내장 웹서버
- **Testing**: Jest + Nock을 활용한 HTTP mocking 테스트
```
