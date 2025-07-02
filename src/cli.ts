#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPackageVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

function showHelp(): void {
  const version = getPackageVersion();
  console.log(`
🟦 Swit MCP Server v${version} 🟧

Model Context Protocol (MCP) 서버로 Claude와 Swit을 연결합니다.

사용법:
  npx swit-mcp [옵션]

옵션:
  --help, -h     이 도움말을 표시합니다
  --version, -v  버전 정보를 표시합니다
  --auth         OAuth 인증을 시작합니다 (개발용)

MCP 클라이언트 설정:
  Claude Desktop 설정 파일에 다음을 추가하세요:

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

환경 변수:
  SWIT_CLIENT_ID       - Swit OAuth 클라이언트 ID (권장)
  SWIT_CLIENT_SECRET   - Swit OAuth 클라이언트 시크릿 (권장)
  SWIT_API_TOKEN       - Swit API Bearer 토큰 (대체)
  OAUTH_PORT           - OAuth 콜백 서버 포트 (기본: 3000)

더 자세한 정보: https://github.com/TykanN/swit-mcp
`);
}

function showVersion(): void {
  console.log(getPackageVersion());
}

async function startAuthFlow(): Promise<void> {
  console.log('🔐 OAuth 인증을 시작합니다...');
  console.log('브라우저에서 http://localhost:3000 을 열어 인증을 완료하세요.');
  
  // 개발 모드로 서버 실행
  const serverPath = join(__dirname, 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, SWIT_MCP_AUTH_MODE: 'true' }
  });

  server.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 인증이 완료되었습니다.');
    } else {
      console.error('❌ 인증 중 오류가 발생했습니다.');
      process.exit(1);
    }
  });
}

async function startMcpServer(): Promise<void> {
  // MCP 서버 모드로 실행
  const serverPath = join(__dirname, 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: 'inherit'
  });

  server.on('close', (code) => {
    process.exit(code || 0);
  });

  server.on('error', (error) => {
    console.error('MCP 서버 실행 중 오류:', error.message);
    process.exit(1);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // 인자가 없으면 MCP 서버 모드로 실행
  if (args.length === 0) {
    await startMcpServer();
    return;
  }

  const command = args[0];

  switch (command) {
    case '--help':
    case '-h':
      showHelp();
      break;
      
    case '--version':
    case '-v':
      showVersion();
      break;
      
    case '--auth':
      await startAuthFlow();
      break;
      
    default:
      console.error(`알 수 없는 옵션: ${command}`);
      console.error('도움말을 보려면 --help를 사용하세요.');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('오류:', error.message);
    process.exit(1);
  });
}