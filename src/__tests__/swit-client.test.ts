import nock from 'nock';
import { SwitClient } from '../swit-client.js';
import { OAuthManager } from '../oauth-manager.js';
import { TokenCache } from '../token-cache.js';
import { OAuthSettings } from '../oauth-settings.js';

describe('SwitClient', () => {
  let client: SwitClient;
  const baseURL = 'https://openapi.swit.io/v1';

  beforeEach(() => {
    // Clear all nock interceptors
    nock.cleanAll();
    
    // Setup with fallback token
    process.env.SWIT_API_TOKEN = 'test-token';
    client = new SwitClient();
  });

  afterEach(() => {
    delete process.env.SWIT_API_TOKEN;
    nock.cleanAll();
  });

  describe('constructor', () => {
    it('should work with OAuth manager', () => {
      const settings = new OAuthSettings('test-id', 'test-secret');
      const tokenCache = new TokenCache();
      const oauthManager = new OAuthManager(settings.config, tokenCache);
      
      const oauthClient = new SwitClient(oauthManager);
      expect(oauthClient).toBeDefined();
    });

    it('should work with API token fallback', () => {
      const fallbackClient = new SwitClient();
      expect(fallbackClient).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      process.env.SWIT_API_BASE_URL = 'https://custom.api.url/v1';
      const customClient = new SwitClient();
      expect(customClient).toBeDefined();
      delete process.env.SWIT_API_BASE_URL;
    });
  });

  describe('listWorkspaces', () => {
    it('should successfully fetch workspaces with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          offset: 'next-page-token-123',
          workspaces: [
            {
              id: 'ws-123456789',
              name: 'Test Workspace',
              domain: 'test-workspace',
              color: '#00ff00',
              photo: '/workspace/photos/ws-123456789.jpg',
              created: '2020-02-03T01:31:37Z',
              admin_ids: ['user-admin-1', 'user-admin-2'],
              master_id: 'user-master-1'
            },
            {
              id: 'ws-987654321',
              name: 'Development Workspace',
              domain: 'dev-workspace',
              color: '#ff0000',
              photo: '/workspace/photos/ws-987654321.jpg',
              created: '2020-03-14T05:00:07Z',
              admin_ids: ['user-admin-3'],
              master_id: 'user-master-2'
            }
          ]
        }
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ limit: 20 })
        .reply(200, mockResponse);

      const args = { limit: 20 };
      const result = await client.listWorkspaces(args);

      expect(result).toEqual(mockResponse);
      expect(result.data.workspaces).toHaveLength(2);
      expect(result.data.workspaces[0].id).toBe('ws-123456789');
      expect(result.data.workspaces[0].name).toBe('Test Workspace');
    });

    it('should handle API errors with proper error format', async () => {
      const errorResponse = {
        error: {
          code: 'INVALID_TOKEN',
          message: 'The provided API token is invalid or expired'
        }
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ limit: 20 })
        .reply(401, errorResponse);

      const args = { limit: 20 };
      await expect(client.listWorkspaces(args)).rejects.toThrow('Swit API Error');
    });

    it('should include optional parameters in request', async () => {
      const mockResponse = { 
        data: { 
          offset: null,
          workspaces: [] 
        } 
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ offset: 'test-offset', limit: 10, name: 'Test WS' })
        .reply(200, mockResponse);

      const args = {
        offset: 'test-offset',
        limit: 10,
        name: 'Test WS'
      };
      
      const result = await client.listWorkspaces(args);
      expect(result.data.workspaces).toEqual([]);
    });
  });

  describe('listChannels', () => {
    it('should successfully fetch channels with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          offset: 'channel-page-token-456',
          channels: [
            {
              id: 'ch-123456789',
              name: 'General',
              type: 'dfl',
              description: 'General discussion channel for the team',
              created: '2020-03-14T05:00:07Z',
              is_archived: false,
              is_member: true,
              is_private: false,
              is_starred: false,
              is_prev_chat_visible: true,
              host_id: 'user-host-1'
            },
            {
              id: 'ch-987654321',
              name: 'Development',
              type: 'gen',
              description: 'Private channel for development discussions',
              created: '2020-03-14T05:00:07Z',
              is_archived: false,
              is_member: true,
              is_private: true,
              is_starred: false,
              is_prev_chat_visible: true,
              host_id: 'user-host-2'
            }
          ]
        }
      };

      nock(baseURL)
        .get('/api/channel.list')
        .query({ workspace_id: 'ws-123', limit: 20 })
        .reply(200, mockResponse);

      const args = { workspace_id: 'ws-123' };
      const result = await client.listChannels(args);

      expect(result).toEqual(mockResponse);
      expect(result.data.channels).toHaveLength(2);
      expect(result.data.channels[0].id).toBe('ch-123456789');
      expect(result.data.channels[1].is_private).toBe(true);
    });

    it('should include optional channel filters', async () => {
      const mockResponse = { 
        data: { 
          offset: null,
          channels: [] 
        } 
      };

      nock(baseURL)
        .get('/api/channel.list')
        .query({ 
          workspace_id: 'ws-123', 
          type: 'private', 
          activity: 'active',
          disclosure: 'private',
          name: 'dev',
          limit: 10 
        })
        .reply(200, mockResponse);

      const args = {
        workspace_id: 'ws-123',
        type: 'private',
        activity: 'active', 
        disclosure: 'private',
        name: 'dev',
        limit: 10
      };
      
      const result = await client.listChannels(args);
      expect(result.data.channels).toEqual([]);
    });
  });

  describe('createMessage', () => {
    it('should successfully create a message with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          message: {
            message_id: 'msg-123456789',
            channel_id: 'ch-123456789',
            user_id: 'user-123',
            user_name: 'Test User',
            content: 'Hello, this is a test message!',
            created: '2020-03-14T05:00:07Z',
            comment_count: 0,
            assets: [],
            attachments: {}
          }
        }
      };

      nock(baseURL)
        .post('/api/message.create', {
          channel_id: 'ch-123456789',
          content: 'Hello, this is a test message!'
        })
        .reply(200, mockResponse);

      const args = {
        channel_id: 'ch-123456789',
        content: 'Hello, this is a test message!'
      };
      
      const result = await client.createMessage(args);
      expect(result).toEqual(mockResponse);
      expect(result.data.message.message_id).toBe('msg-123456789');
      expect(result.data.message.comment_count).toBe(0);
    });

    it('should create message with optional parameters', async () => {
      const mockResponse = { 
        data: { 
          message: {
            message_id: 'msg-987654321',
            channel_id: 'ch-123456789',
            user_id: 'user-123',
            user_name: 'Test User',
            content: 'Message with attachments',
            created: '2020-03-14T05:00:07Z',
            comment_count: 0,
            assets: [{ id: 'asset-1', name: 'file.pdf' }],
            attachments: { type: 'file' }
          } 
        } 
      };

      nock(baseURL)
        .post('/api/message.create', {
          channel_id: 'ch-123456789',
          content: 'Message with attachments',
          body_type: 'plain',
          assets: [{ id: 'asset-1', name: 'file.pdf' }],
          attachments: { type: 'file' }
        })
        .reply(200, mockResponse);

      const args = {
        channel_id: 'ch-123456789',
        content: 'Message with attachments',
        body_type: 'plain' as const,
        assets: [{ id: 'asset-1', name: 'file.pdf' }],
        attachments: { type: 'file' }
      };
      
      const result = await client.createMessage(args);
      expect(result.data.message.message_id).toBe('msg-987654321');
    });

    it('should handle message creation errors', async () => {
      const errorResponse = {
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'The specified channel does not exist or you do not have access'
        }
      };

      nock(baseURL)
        .post('/api/message.create')
        .reply(404, errorResponse);

      const args = {
        channel_id: 'ch-nonexistent'
      };
      
      await expect(client.createMessage(args)).rejects.toThrow('Swit API Error');
    });
  });

  describe('createMessageComment', () => {
    it('should successfully create a comment with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          comment: {
            comment_id: 'comment-123456789',
            user_id: 'user-456',
            user_name: 'Comment User',
            content: 'Great message! Thanks for sharing.',
            created: '2020-03-14T05:00:07Z',
            assets: []
          }
        }
      };

      nock(baseURL)
        .post('/api/message.comment.create', {
          message_id: 'msg-123456789',
          content: 'Great message! Thanks for sharing.'
        })
        .reply(200, mockResponse);

      const args = {
        message_id: 'msg-123456789',
        content: 'Great message! Thanks for sharing.'
      };
      
      const result = await client.createMessageComment(args);
      expect(result).toEqual(mockResponse);
      expect(result.data.comment.comment_id).toBe('comment-123456789');
      expect(result.data.comment.user_name).toBe('Comment User');
    });

    it('should create comment with optional parameters', async () => {
      const mockResponse = { 
        data: { 
          comment: {
            comment_id: 'comment-987654321',
            user_id: 'user-789',
            user_name: 'Asset User',
            content: 'Comment with asset',
            created: '2020-03-14T05:00:07Z',
            assets: [{ id: 'asset-2', name: 'image.png' }]
          } 
        } 
      };

      nock(baseURL)
        .post('/api/message.comment.create', {
          message_id: 'msg-123456789',
          content: 'Comment with asset',
          body_type: 'plain',
          assets: [{ id: 'asset-2', name: 'image.png' }]
        })
        .reply(200, mockResponse);

      const args = {
        message_id: 'msg-123456789',
        content: 'Comment with asset',
        body_type: 'plain' as const,
        assets: [{ id: 'asset-2', name: 'image.png' }]
      };
      
      const result = await client.createMessageComment(args);
      expect(result.data.comment.comment_id).toBe('comment-987654321');
    });

    it('should handle network errors gracefully', async () => {
      nock(baseURL)
        .post('/api/message.comment.create')
        .replyWithError('Network connection failed');

      const args = {
        message_id: 'msg-123456789',
        content: 'Test comment'
      };
      
      await expect(client.createMessageComment(args)).rejects.toThrow('Network connection failed');
    });

    it('should handle comment creation errors', async () => {
      const errorResponse = {
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'The specified message does not exist or you do not have access'
        }
      };

      nock(baseURL)
        .post('/api/message.comment.create')
        .reply(404, errorResponse);

      const args = {
        message_id: 'msg-nonexistent',
        content: 'Test comment'
      };
      
      await expect(client.createMessageComment(args)).rejects.toThrow('Swit API Error');
    });
  });

  describe('listMessageComments', () => {
    it('should successfully fetch message comments with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          offset: 'comment-page-token-789',
          comments: [
            {
              comment_id: 'comment-123456789',
              user_id: 'user-456',
              user_name: 'Comment User',
              content: 'Great message! Thanks for sharing.',
              created: '2020-03-14T05:00:07Z',
              assets: []
            },
            {
              comment_id: 'comment-987654321',
              user_id: 'user-789',
              user_name: 'Another User',
              content: 'I agree with this point.',
              created: '2020-03-14T05:15:22Z',
              assets: [{ id: 'asset-1', name: 'screenshot.png' }]
            }
          ]
        }
      };

      nock(baseURL)
        .get('/api/message.comment.list')
        .query({ message_id: 'msg-123456789', limit: 20 })
        .reply(200, mockResponse);

      const args = { message_id: 'msg-123456789' };
      const result = await client.listMessageComments(args);

      expect(result).toEqual(mockResponse);
      expect(result.data.comments).toHaveLength(2);
      expect(result.data.comments[0].comment_id).toBe('comment-123456789');
      expect(result.data.comments[1].assets).toBeDefined();
    });

    it('should include optional parameters in request', async () => {
      const mockResponse = { 
        data: { 
          offset: null,
          comments: [] 
        } 
      };

      nock(baseURL)
        .get('/api/message.comment.list')
        .query({ message_id: 'msg-123', offset: 'test-offset', limit: 10 })
        .reply(200, mockResponse);

      const args = {
        message_id: 'msg-123',
        offset: 'test-offset',
        limit: 10
      };
      
      const result = await client.listMessageComments(args);
      expect(result.data.comments).toEqual([]);
    });

    it('should handle message comment list errors', async () => {
      const errorResponse = {
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'The specified message does not exist or you do not have access'
        }
      };

      nock(baseURL)
        .get('/api/message.comment.list')
        .query({ message_id: 'msg-nonexistent', limit: 20 })
        .reply(404, errorResponse);

      const args = { message_id: 'msg-nonexistent' };
      await expect(client.listMessageComments(args)).rejects.toThrow('Swit API Error');
    });
  });

  describe('listProjects', () => {
    it('should successfully fetch projects with OpenAPI compliant response', async () => {
      const mockResponse = {
        data: {
          offset: 'project-page-token-456',
          projects: [
            {
              id: 'proj-123456789',
              name: 'Website Redesign',
              description: 'Complete redesign of the company website',
              created: '2020-03-14T05:00:07Z',
              color: '#3498db',
              is_archived: false,
              is_private: false,
              is_starred: true,
              host_id: 'user-host-1'
            },
            {
              id: 'proj-987654321',
              name: 'Mobile App Development',
              description: 'Native mobile application for iOS and Android',
              created: '2020-04-20T10:30:15Z',
              color: '#e74c3c',
              is_archived: false,
              is_private: true,
              is_starred: false,
              host_id: 'user-host-2'
            }
          ]
        }
      };

      nock(baseURL)
        .get('/api/project.list')
        .query({ workspace_id: 'ws-123', limit: 20 })
        .reply(200, mockResponse);

      const args = { workspace_id: 'ws-123' };
      const result = await client.listProjects(args);

      expect(result).toEqual(mockResponse);
      expect(result.data.projects).toHaveLength(2);
      expect(result.data.projects[0].id).toBe('proj-123456789');
      expect(result.data.projects[1].is_private).toBe(true);
    });

    it('should include optional project filters', async () => {
      const mockResponse = { 
        data: { 
          offset: null,
          projects: [] 
        } 
      };

      nock(baseURL)
        .get('/api/project.list')
        .query({ 
          workspace_id: 'ws-123', 
          activity: 'act',
          disclosure: 'pub',
          name: 'Website',
          limit: 10 
        })
        .reply(200, mockResponse);

      const args = {
        workspace_id: 'ws-123',
        activity: 'act',
        disclosure: 'pub',
        name: 'Website',
        limit: 10
      };
      
      const result = await client.listProjects(args);
      expect(result.data.projects).toEqual([]);
    });

    it('should handle project list errors', async () => {
      const errorResponse = {
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'The specified workspace does not exist or you do not have access'
        }
      };

      nock(baseURL)
        .get('/api/project.list')
        .query({ workspace_id: 'ws-nonexistent', limit: 20 })
        .reply(404, errorResponse);

      const args = { workspace_id: 'ws-nonexistent' };
      await expect(client.listProjects(args)).rejects.toThrow('Swit API Error');
    });
  });

  describe('error handling', () => {
    it('should handle unauthorized access', async () => {
      const errorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ limit: 20 })
        .reply(401, errorResponse);

      await expect(client.listWorkspaces({})).rejects.toThrow('Swit API Error');
    });

    it('should handle rate limiting', async () => {
      const errorResponse = {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit exceeded. Please retry after some time.'
        }
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ limit: 20 })
        .reply(429, errorResponse);

      await expect(client.listWorkspaces({})).rejects.toThrow('Swit API Error');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred'
        }
      };

      nock(baseURL)
        .get('/api/workspace.list')
        .query({ limit: 20 })
        .reply(500, errorResponse);

      await expect(client.listWorkspaces({})).rejects.toThrow('Swit API Error');
    });
  });
});