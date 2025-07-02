import { SwitClient } from './swit-client.js';
import { OAuthWebServer } from './oauth-web-server.js';
import {
  WorkspaceListArgsSchema,
  ChannelListArgsSchema,
  MessageCreateArgsSchema,
  MessageCommentListArgsSchema,
  MessageCommentCreateArgsSchema,
  ProjectListArgsSchema,
} from './schemas.js';

export const createHandlers = (switClient: SwitClient | null, oauthWebServer: OAuthWebServer | null): Record<string, (args?: any) => Promise<any>> => {
  return {
    'swit-oauth-status': async () => {
      console.error('OAuth status check requested');
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

      console.error('OAuth status checked:', isAuthenticated);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    },

    'swit-oauth-start': async () => {
      console.error('OAuth authentication start requested');

      if (!oauthWebServer) {
        console.error('OAuth web server not initialized');
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
        console.error('OAuth already authenticated');
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

      console.error('OAuth authorization URL generated');

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
    },

    'swit-oauth-logout': async () => {
      console.error('OAuth logout requested');

      if (!oauthWebServer) {
        console.error('OAuth web server not available for logout');
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

        console.error('OAuth logout completed successfully');

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
        console.error('OAuth logout failed:', error instanceof Error ? error.message : String(error));

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
    },

    'swit-workspace-list': async (args: any) => {
      console.error('Workspace list request:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit client not initialized');
        throw new Error('Swit client is not initialized.');
      }

      const validatedArgs = WorkspaceListArgsSchema.parse(args || {});
      const workspaces = await switClient.listWorkspaces(validatedArgs);

      console.error('Workspace list retrieved:', workspaces?.data?.workspaces?.length || 0);

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
    },

    'swit-channel-list': async (args: any) => {
      console.error('채널 목록 조회 요청:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit 클라이언트가 초기화되지 않음');
        throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
      }

      const validatedArgs = ChannelListArgsSchema.parse(args || {});
      const channels = await switClient.listChannels(validatedArgs);

      console.error('채널 목록 조회 완료:', validatedArgs.workspace_id, channels?.data?.channels?.length || 0);

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
    },

    'swit-message-create': async (args: any) => {
      console.error('메시지 생성 요청:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit 클라이언트가 초기화되지 않음');
        throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
      }

      const validatedArgs = MessageCreateArgsSchema.parse(args || {});
      const message = await switClient.createMessage(validatedArgs);

      console.error('메시지 생성 완료:', validatedArgs.channel_id, message?.data?.message?.message_id);

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
    },

    'swit-message-comment-create': async (args: any) => {
      console.error('메시지 코멘트 생성 요청:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit 클라이언트가 초기화되지 않음');
        throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
      }

      const validatedArgs = MessageCommentCreateArgsSchema.parse(args || {});
      const comment = await switClient.createMessageComment(validatedArgs);

      console.error('메시지 코멘트 생성 완료:', validatedArgs.message_id, comment?.data?.comment?.comment_id);

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
    },

    'swit-message-comment-list': async (args: any) => {
      console.error('메시지 댓글 목록 조회 요청:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit 클라이언트가 초기화되지 않음');
        throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
      }

      const validatedArgs = MessageCommentListArgsSchema.parse(args || {});
      const comments = await switClient.listMessageComments(validatedArgs);

      console.error('메시지 댓글 목록 조회 완료:', validatedArgs.message_id, comments?.data?.comments?.length || 0);

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
    },

    'swit-project-list': async (args: any) => {
      console.error('프로젝트 목록 조회 요청:', JSON.stringify(args));

      if (!switClient) {
        console.error('Swit 클라이언트가 초기화되지 않음');
        throw new Error('Swit 클라이언트가 초기화되지 않았습니다.');
      }

      const validatedArgs = ProjectListArgsSchema.parse(args || {});
      const projects = await switClient.listProjects(validatedArgs);

      console.error('프로젝트 목록 조회 완료:', validatedArgs.workspace_id, projects?.data?.projects?.length || 0);

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
    },
  };
};