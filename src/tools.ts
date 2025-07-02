import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import {
  WorkspaceListArgsSchema,
  ChannelListArgsSchema,
  MessageCreateArgsSchema,
  MessageCommentListArgsSchema,
  MessageCommentCreateArgsSchema,
  ProjectListArgsSchema,
} from './schemas.js';

// OAuth 도구들을 위한 빈 스키마
const EmptySchema = z.object({});

export const tools = [
  // OAuth 관련 도구들
  {
    name: 'swit-oauth-status',
    description: 'OAuth 인증 상태를 확인합니다',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
  {
    name: 'swit-oauth-start',
    description: 'OAuth 인증을 시작합니다. 브라우저에서 열 수 있는 인증 URL을 반환합니다.',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
  {
    name: 'swit-oauth-logout',
    description: 'OAuth 인증을 해제하고 저장된 토큰을 삭제합니다. 재인증이 필요한 경우 사용합니다.',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
  // Swit API 도구들
  {
    name: 'swit-workspace-list',
    description: '워크스페이스 목록을 조회합니다',
    inputSchema: zodToJsonSchema(WorkspaceListArgsSchema),
  },
  {
    name: 'swit-channel-list',
    description: '채널 목록을 조회합니다',
    inputSchema: zodToJsonSchema(ChannelListArgsSchema),
  },
  {
    name: 'swit-message-create',
    description: '채널에 메시지를 전송합니다',
    inputSchema: zodToJsonSchema(MessageCreateArgsSchema),
  },
  {
    name: 'swit-message-comment-create',
    description: '메시지에 코멘트를 남깁니다',
    inputSchema: zodToJsonSchema(MessageCommentCreateArgsSchema),
  },
  {
    name: 'swit-message-comment-list',
    description: '메시지의 댓글 목록을 조회합니다',
    inputSchema: zodToJsonSchema(MessageCommentListArgsSchema),
  },
  {
    name: 'swit-project-list',
    description: '프로젝트 목록을 조회합니다',
    inputSchema: zodToJsonSchema(ProjectListArgsSchema),
  },
];
