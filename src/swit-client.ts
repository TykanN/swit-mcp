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
  ErrorResponse
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
        try {
          const accessToken = await this.oauthManager.getValidAccessToken();
          config.headers.Authorization = `Bearer ${accessToken}`;
        } catch (error) {
          throw new Error(`OAuth authentication failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        // 환경변수에서 토큰 사용 (fallback)
        const apiToken = process.env.SWIT_API_TOKEN;
        if (!apiToken) {
          throw new Error('No OAuth manager provided and SWIT_API_TOKEN environment variable is not set');
        }
        config.headers.Authorization = `Bearer ${apiToken}`;
      }
      return config;
    });
  }

  async listWorkspaces(args: WorkspaceListArgs): Promise<WorkspaceListResponse> {
    try {
      const params: Record<string, any> = {};
      if (args.offset) params.offset = args.offset;
      if (args.limit) params.limit = args.limit;
      else params.limit = 20; // 기본값
      if (args.name) params.name = args.name;

      const response = await this.client.get('/api/workspace.list', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // 에러 응답 구조를 정확히 모르므로 원본 응답을 그대로 포함
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }

  async listChannels(args: ChannelListArgs): Promise<ChannelListResponse> {
    try {
      const params: Record<string, any> = {
        workspace_id: args.workspace_id
      };
      if (args.offset) params.offset = args.offset;
      if (args.limit) params.limit = args.limit;
      else params.limit = 20; // 기본값
      if (args.type) params.type = args.type;
      if (args.activity) params.activity = args.activity;
      if (args.disclosure) params.disclosure = args.disclosure;
      if (args.name) params.name = args.name;

      const response = await this.client.get('/api/channel.list', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // 에러 응답 구조를 정확히 모르므로 원본 응답을 그대로 포함
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }

  async createMessage(args: MessageCreateArgs): Promise<MessageCreateResponse> {
    try {
      const requestData: Record<string, any> = {
        channel_id: args.channel_id
      };
      if (args.content) requestData.content = args.content;
      if (args.body_type) requestData.body_type = args.body_type;
      if (args.assets) requestData.assets = args.assets;
      if (args.attachments) requestData.attachments = args.attachments;
      if (args.external_asset_type) requestData.external_asset_type = args.external_asset_type;

      const response = await this.client.post('/api/message.create', requestData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // 에러 응답 구조를 정확히 모르므로 원본 응답을 그대로 포함
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }

  async listMessageComments(args: MessageCommentListArgs): Promise<MessageCommentListResponse> {
    try {
      const params: Record<string, any> = {
        message_id: args.message_id
      };
      if (args.offset) params.offset = args.offset;
      if (args.limit) params.limit = args.limit;
      else params.limit = 20; // 기본값

      const response = await this.client.get('/api/message.comment.list', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }

  async createMessageComment(args: MessageCommentCreateArgs): Promise<MessageCommentCreateResponse> {
    try {
      const requestData: Record<string, any> = {
        message_id: args.message_id,
        content: args.content
      };
      if (args.body_type) requestData.body_type = args.body_type;
      if (args.assets) requestData.assets = args.assets;
      if (args.external_asset_type) requestData.external_asset_type = args.external_asset_type;

      const response = await this.client.post('/api/message.comment.create', requestData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }

  async listProjects(args: ProjectListArgs): Promise<ProjectListResponse> {
    try {
      const params: Record<string, any> = {
        workspace_id: args.workspace_id
      };
      if (args.offset) params.offset = args.offset;
      if (args.limit) params.limit = args.limit;
      else params.limit = 20; // 기본값
      if (args.activity) params.activity = args.activity;
      if (args.disclosure) params.disclosure = args.disclosure;
      if (args.name) params.name = args.name;

      const response = await this.client.get('/api/project.list', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = `Swit API Error: ${JSON.stringify(error.response.data)}`;
        const newError = new Error(errorMessage);
        (newError as any).response = error.response.data;
        throw newError;
      }
      throw error;
    }
  }
}