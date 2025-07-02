#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SwitClient } from './swit-client.js';
import {
  WorkspaceListArgsSchema,
  ChannelListArgsSchema,
  MessageCreateArgsSchema,
  MessageCommentListArgsSchema,
  MessageCommentCreateArgsSchema,
  ProjectListArgsSchema,
} from './schemas.js';
import { OAuthWebServer } from './oauth-web-server.js';
import { OAuthSettings } from './oauth-settings.js';
import { TokenCache } from './token-cache.js';
import { logger } from './logger.js';

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

    // SwitClient 초기화
    switClient = new SwitClient(oauthWebServer.getOAuthManager());

    logger.info('OAuth web server started successfully', { port: settings.port });
    if (!oauthWebServer.isAuthenticated()) {
      logger.info('OAuth authentication required', {
        url: `http://localhost:${settings.port}`,
        message: 'Open the URL in browser to complete authentication',
      });
    }
  } catch (error) {
    logger.error('OAuth initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    logger.info('Falling back to SWIT_API_TOKEN environment variable');
    switClient = new SwitClient();
  }
}

const server = new Server(
  {
    name: 'swit-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    // OAuth 관련 도구들
    {
      name: 'swit-oauth-status',
      description: 'OAuth 인증 상태를 확인합니다',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'swit-oauth-start',
      description: 'OAuth 인증을 시작합니다. 브라우저에서 열 수 있는 인증 URL을 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'swit-oauth-logout',
      description:
        'OAuth 인증을 해제하고 저장된 토큰을 삭제합니다. 재인증이 필요한 경우 사용합니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    // Swit API 도구들
    {
      name: 'swit-workspace-list',
      description: '워크스페이스 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          offset: {
            type: 'string',
            description: '페이지네이션 오프셋 (이전 응답의 offset 값)',
          },
          limit: {
            type: 'number',
            description: '조회할 개수 (기본값: 20, 최대: 100)',
            default: 20,
            maximum: 100,
          },
          name: {
            type: 'string',
            description: '워크스페이스 이름으로 필터링',
          },
        },
      },
    },
    {
      name: 'swit-channel-list',
      description: '채널 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_id: {
            type: 'string',
            description: '워크스페이스 ID',
          },
          offset: {
            type: 'string',
            description: '페이지네이션 오프셋 (이전 응답의 offset 값)',
          },
          limit: {
            type: 'number',
            description: '조회할 개수 (기본값: 20, 최대: 100)',
            default: 20,
            maximum: 100,
          },
          type: {
            type: 'string',
            description: '채널 타입으로 필터링',
          },
          activity: {
            type: 'string',
            description: '활동 상태로 필터링',
          },
          disclosure: {
            type: 'string',
            description: '공개 범위로 필터링',
          },
          name: {
            type: 'string',
            description: '채널 이름으로 필터링',
          },
        },
        required: ['workspace_id'],
      },
    },
    {
      name: 'swit-message-create',
      description: '채널에 메시지를 전송합니다',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: {
            type: 'string',
            description: '채널 ID',
          },
          content: {
            type: 'string',
            description: '메시지 내용',
          },
          body_type: {
            type: 'string',
            enum: ['plain', 'markdown'],
            description: '메시지 본문 타입',
            default: 'plain',
          },
          assets: {
            type: 'array',
            description: '첨부 자산 목록',
          },
          attachments: {
            type: 'object',
            description: '첨부 파일',
          },
          external_asset_type: {
            type: 'string',
            description: '외부 자산 타입',
          },
        },
        required: ['channel_id'],
      },
    },
    {
      name: 'swit-message-comment-create',
      description: '메시지에 코멘트를 남깁니다',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: '메시지 ID',
          },
          content: {
            type: 'string',
            description: '코멘트 내용',
          },
          body_type: {
            type: 'string',
            enum: ['plain', 'markdown'],
            description: '코멘트 본문 타입',
            default: 'plain',
          },
          assets: {
            type: 'object',
            description: '첨부 자산',
          },
          external_asset_type: {
            type: 'string',
            description: '외부 자산 타입',
          },
        },
        required: ['message_id', 'content'],
      },
    },
    {
      name: 'swit-message-comment-list',
      description: '메시지의 댓글 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          message_id: {
            type: 'string',
            description: '메시지 ID',
          },
          offset: {
            type: 'string',
            description: '페이지네이션 오프셋 (이전 응답의 offset 값)',
          },
          limit: {
            type: 'number',
            description: '조회할 개수 (기본값: 20, 최대: 100)',
            default: 20,
            maximum: 100,
          },
        },
        required: ['message_id'],
      },
    },
    {
      name: 'swit-project-list',
      description: '프로젝트 목록을 조회합니다',
      inputSchema: {
        type: 'object',
        properties: {
          workspace_id: {
            type: 'string',
            description: '워크스페이스 ID',
          },
          offset: {
            type: 'string',
            description: '페이지네이션 오프셋 (이전 응답의 offset 값)',
          },
          limit: {
            type: 'number',
            description: '조회할 개수 (기본값: 20, 최대: 100)',
            default: 20,
            maximum: 100,
          },
          activity: {
            type: 'string',
            description: '활동 상태로 필터링 (act: 활성, arch: 아카이브)',
          },
          disclosure: {
            type: 'string',
            description: '공개 범위로 필터링 (pub: 공개, pri: 비공개)',
          },
          name: {
            type: 'string',
            description: '프로젝트 이름으로 필터링',
          },
        },
        required: ['workspace_id'],
      },
    },
  ];

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'swit-oauth-status': {
        logger.info('OAuth status check requested');
        const isAuthenticated = oauthWebServer?.isAuthenticated() || false;
        const port = process.env.OAUTH_PORT || '3000';

        const response = {
          success: true,
          data: {
            authenticated: isAuthenticated,
            status: isAuthenticated ? 'Authenticated' : 'Authentication required',
            webServerUrl: oauthWebServer ? `http://localhost:${port}` : null,
            message: isAuthenticated
              ? 'OAuth authentication completed. Swit API is ready to use.'
              : 'OAuth authentication required. Use swit-oauth-start tool to begin authentication.',
          },
          timestamp: new Date().toISOString(),
        };

        logger.info('OAuth status checked', { authenticated: isAuthenticated });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-oauth-start': {
        logger.info('OAuth authentication start requested');

        if (!oauthWebServer) {
          logger.error('OAuth web server not initialized');
          const errorResponse = {
            success: false,
            error: {
              code: 'OAUTH_SERVER_NOT_INITIALIZED',
              message:
                'OAuth web server is not initialized. Please check SWIT_CLIENT_ID and SWIT_CLIENT_SECRET environment variables.',
            },
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }

        if (oauthWebServer.isAuthenticated()) {
          logger.info('OAuth already authenticated');
          const response = {
            success: true,
            data: {
              message: 'OAuth authentication already completed.',
              note: 'To re-authenticate, please logout first.',
            },
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        const authUrl = oauthWebServer.getAuthorizationUrl();
        const port = process.env.OAUTH_PORT || '3000';

        logger.info('OAuth authorization URL generated');

        const response = {
          success: true,
          data: {
            authorizationUrl: authUrl,
            webServerUrl: `http://localhost:${port}`,
            instructions: [
              '1. Open the authorizationUrl above in your browser.',
              '2. Login with your Swit account and authorize the application.',
              '3. The token will be automatically saved upon completion.',
              '4. Use swit-oauth-status to check authentication status.',
            ],
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-oauth-logout': {
        logger.info('OAuth logout requested');

        if (!oauthWebServer) {
          logger.error('OAuth web server not available for logout');
          const errorResponse = {
            success: false,
            error: {
              code: 'OAUTH_SERVER_NOT_AVAILABLE',
              message: 'OAuth web server is not available. Cannot perform logout.',
            },
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }

        try {
          // OAuth 로그아웃 실행
          oauthWebServer.getOAuthManager().logout();

          logger.info('OAuth logout completed successfully');

          const response = {
            success: true,
            data: {
              message: 'OAuth logout completed successfully.',
              note: 'Cached tokens have been cleared. Use swit-oauth-start to re-authenticate.',
            },
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          logger.error('OAuth logout failed', {
            error: error instanceof Error ? error.message : String(error),
          });

          const errorResponse = {
            success: false,
            error: {
              code: 'OAUTH_LOGOUT_FAILED',
              message: 'Failed to logout from OAuth.',
              details: error instanceof Error ? error.message : String(error),
            },
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'swit-workspace-list': {
        logger.info('Workspace list request', { args });

        if (!switClient) {
          logger.error('Swit client not initialized');
          throw new Error('Swit client is not initialized.');
        }

        const validatedArgs = WorkspaceListArgsSchema.parse(args || {});
        const workspaces = await switClient.listWorkspaces(validatedArgs);

        logger.info('Workspace list retrieved', {
          count: workspaces?.data?.workspaces?.length || 0,
        });

        const response = {
          success: true,
          data: workspaces,
          meta: {
            tool: 'swit-workspace-list',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-channel-list': {
        logger.info('채널 목록 조회 요청', { args });

        if (!switClient) {
          logger.error('Swit 클라이언트가 초기화되지 않음');
          throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
        }

        const validatedArgs = ChannelListArgsSchema.parse(args || {});
        const channels = await switClient.listChannels(validatedArgs);

        logger.info('채널 목록 조회 완료', {
          workspaceId: validatedArgs.workspace_id,
          count: channels?.data?.channels?.length || 0,
        });

        const response = {
          success: true,
          data: channels,
          meta: {
            tool: 'swit-channel-list',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-message-create': {
        logger.info('메시지 생성 요청', { args });

        if (!switClient) {
          logger.error('Swit 클라이언트가 초기화되지 않음');
          throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
        }

        const validatedArgs = MessageCreateArgsSchema.parse(args || {});
        const message = await switClient.createMessage(validatedArgs);

        logger.info('메시지 생성 완료', {
          channelId: validatedArgs.channel_id,
          messageId: message?.data?.message?.message_id,
        });

        const response = {
          success: true,
          data: message,
          meta: {
            tool: 'swit-message-create',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-message-comment-create': {
        logger.info('메시지 코멘트 생성 요청', { args });

        if (!switClient) {
          logger.error('Swit 클라이언트가 초기화되지 않음');
          throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
        }

        const validatedArgs = MessageCommentCreateArgsSchema.parse(args || {});
        const comment = await switClient.createMessageComment(validatedArgs);

        logger.info('메시지 코멘트 생성 완료', {
          messageId: validatedArgs.message_id,
          commentId: comment?.data?.comment?.comment_id,
        });

        const response = {
          success: true,
          data: comment,
          meta: {
            tool: 'swit-message-comment-create',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-message-comment-list': {
        logger.info('메시지 댓글 목록 조회 요청', { args });

        if (!switClient) {
          logger.error('Swit 클라이언트가 초기화되지 않음');
          throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
        }

        const validatedArgs = MessageCommentListArgsSchema.parse(args || {});
        const comments = await switClient.listMessageComments(validatedArgs);

        logger.info('메시지 댓글 목록 조회 완료', {
          messageId: validatedArgs.message_id,
          count: comments?.data?.comments?.length || 0,
        });

        const response = {
          success: true,
          data: comments,
          meta: {
            tool: 'swit-message-comment-list',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'swit-project-list': {
        logger.info('프로젝트 목록 조회 요청', { args });

        if (!switClient) {
          logger.error('Swit 클라이언트가 초기화되지 않음');
          throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
        }

        const validatedArgs = ProjectListArgsSchema.parse(args || {});
        const projects = await switClient.listProjects(validatedArgs);

        logger.info('프로젝트 목록 조회 완료', {
          workspaceId: validatedArgs.workspace_id,
          count: projects?.data?.projects?.length || 0,
        });

        const response = {
          success: true,
          data: projects,
          meta: {
            tool: 'swit-project-list',
            requestParams: validatedArgs,
          },
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 원본 Swit API 응답이 있는 경우 포함
    const apiResponse = (error as any)?.response;

    logger.error('MCP 도구 실행 중 오류 발생', {
      tool: name,
      error: errorMessage,
      apiResponse,
      args,
    });

    const errorResponse = {
      success: false,
      error: {
        code: 'TOOL_EXECUTION_ERROR',
        message: errorMessage,
        tool: name,
        ...(apiResponse && { apiResponse }), // API 응답이 있으면 포함
      },
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
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

// 프로세스 종료 시 웹서버 정리
process.on('SIGINT', async () => {
  logger.info('Process terminating...');
  if (oauthWebServer) {
    await oauthWebServer.stopServer();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Process terminating...');
  if (oauthWebServer) {
    await oauthWebServer.stopServer();
  }
  process.exit(0);
});

// ES 모듈에서는 require.main 대신 import.meta.url 사용
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : '';
    
    // MCP 클라이언트가 볼 수 있도록 stderr에 출력
    console.error('MCP Server startup failed:', errorMessage);
    console.error('Stack trace:', stackTrace);
    
    logger.error('Main 함수 실행 중 오류: ' + errorMessage, { 
      stack: stackTrace,
      error: error 
    });
    process.exit(1);
  });
}
