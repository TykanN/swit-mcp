#!/usr/bin/env node
import pkg from '../package.json' with { type: 'json' };

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SwitClient } from './swit-client.js';
import { OAuthWebServer } from './oauth-web-server.js';
import { OAuthSettings } from './oauth-settings.js';
import { TokenCache } from './token-cache.js';
import { oauthTools } from './tools/oauth.tools.js';
import { coreTools } from './tools/core.tools.js';
import { oauthHandlers } from './handlers/oauth.handlers.js';
import { coreHandlers } from './handlers/core.handlers.js';

// 전역 변수
let oauthWebServer: OAuthWebServer | null = null;
let switClient: SwitClient | null = null;

// OAuth 설정
const getOAuthSettings = (): OAuthSettings => {
  const port = parseInt(process.env.OAUTH_PORT || '3000');
  return OAuthSettings.fromEnvironment(port);
};

// OAuth 웹서버 및 클라이언트 초기화
async function initializeOAuth() {
  try {
    const settings = getOAuthSettings();
    const tokenCache = new TokenCache();
    oauthWebServer = new OAuthWebServer(settings, tokenCache);

    // 웹서버 시작
    await oauthWebServer.startServer();
    console.error(`OAuth web server started successfully on port ${settings.port}`);

    // SwitClient 초기화
    switClient = new SwitClient(oauthWebServer.getOAuthManager());
  } catch (error) {
    console.error(
      'OAuth initialization failed:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('Falling back to SWIT_API_TOKEN environment variable');
    switClient = new SwitClient();
  }
}

const server = new Server(
  {
    name: 'swit-mcp',
    version: pkg.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [...oauthTools, ...coreTools] };
});

// 핸들러 변수 선언
let toolHandlers: Record<string, (args?: any) => Promise<any>> = {};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const handler = toolHandlers[name];
    if (!handler) throw new Error(`Unknown tool: ${name}`);
    const result = await handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('MCP 도구 실행 중 오류 발생:', name, errorMessage);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { code: 'TOOL_EXECUTION_ERROR', message: errorMessage, tool: name },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  try {
    console.error('Starting MCP server initialization...');

    // OAuth 초기화
    console.error('Initializing OAuth...');
    await initializeOAuth();
    console.error('OAuth initialization completed');

    // 핸들러 생성 (OAuth 및 클라이언트 초기화 후)
    if (!switClient) {
      throw new Error('SwitClient initialization failed');
    }
    toolHandlers = { ...oauthHandlers(oauthWebServer), ...coreHandlers(switClient) };

    // MCP 서버 시작
    console.error('Starting MCP server transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP server connected successfully');
  } catch (error) {
    console.error('Error in main():', error);
    throw error;
  }
}

// 정리 함수
async function cleanup(reason: string) {
  console.error(`Process terminating (${reason})...`);
  if (oauthWebServer) {
    try {
      await oauthWebServer.stopServer();
    } catch (error) {
      console.error('Error stopping OAuth web server:', error);
    }
  }
}

// 프로세스 종료 시 웹서버 정리
process.on('SIGINT', async () => {
  await cleanup('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup('SIGTERM');
  process.exit(0);
});

// MCP 환경을 위한 추가 정리 로직
process.on('disconnect', async () => {
  await cleanup('disconnect');
  process.exit(0);
});

// stdin이 닫힐 때 (MCP 클라이언트 연결 해제)
process.stdin.on('end', async () => {
  await cleanup('stdin end');
  process.exit(0);
});

process.stdin.on('error', async () => {
  await cleanup('stdin error');
  process.exit(1);
});

// MCP 서버 시작
main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : '';

  // MCP 클라이언트가 볼 수 있도록 stderr에 출력
  console.error('MCP Server startup failed:', errorMessage);
  console.error('Stack trace:', stackTrace);

  console.error('Main 함수 실행 중 오류:', errorMessage, stackTrace);
  process.exit(1);
});
