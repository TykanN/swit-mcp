import axios, { AxiosInstance } from 'axios';
import {
  WorkspaceListArgs,
  WorkspaceListResponse,
  ChannelListArgs,
  ChannelListResponse,
  MessageCreateArgs,
  MessageCreateResponse,
  MessageCommentListArgs,
  MessageCommentListResponse,
  MessageCommentCreateArgs,
  MessageCommentCreateResponse,
  ProjectListArgs,
  ProjectListResponse,
} from './schemas.js';
import { OAuthManager } from './oauth-manager.js';

export class SwitClient {
  private client: AxiosInstance;
  private oauthManager: OAuthManager | null = null;

  constructor(oauthManager?: OAuthManager) {
    const baseURL = process.env.SWIT_API_BASE_URL || 'https://openapi.swit.io/v1';
    this.oauthManager = oauthManager || null;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터로 OAuth 토큰 자동 추가
    this.client.interceptors.request.use(async (config) => {
      if (this.oauthManager) {
        const accessToken = await this.oauthManager.getValidAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        // 환경변수에서 토큰 사용 (fallback)
        const apiToken = process.env.SWIT_API_TOKEN;
        if (!apiToken) {
          throw new Error(
            'No OAuth manager provided and SWIT_API_TOKEN environment variable is not set'
          );
        }
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
      return config;
    });
  }

  async listWorkspaces(args: WorkspaceListArgs): Promise<WorkspaceListResponse> {
    const response = await this.client.get('/api/workspace.list', { params: args });
    return response.data;
  }

  async listChannels(args: ChannelListArgs): Promise<ChannelListResponse> {
    const response = await this.client.get('/api/channel.list', { params: args });
    return response.data;
  }

  async createMessage(args: MessageCreateArgs): Promise<MessageCreateResponse> {
    const response = await this.client.post('/api/message.create', args);
    return response.data;
  }

  async listMessageComments(args: MessageCommentListArgs): Promise<MessageCommentListResponse> {
    const response = await this.client.get('/api/message.comment.list', { params: args });
    return response.data;
  }

  async createMessageComment(
    args: MessageCommentCreateArgs
  ): Promise<MessageCommentCreateResponse> {
    const response = await this.client.post('/api/message.comment.create', args);
    return response.data;
  }

  async listProjects(args: ProjectListArgs): Promise<ProjectListResponse> {
    const response = await this.client.get('/api/project.list', { params: args });
    return response.data;
  }
}
