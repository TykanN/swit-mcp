import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  WorkspaceListArgsSchema,
  ChannelListArgsSchema,
  MessageCreateArgsSchema,
  MessageCommentListArgsSchema,
  MessageCommentCreateArgsSchema,
  ProjectListArgsSchema,
} from '../schemas.js';

export const coreTools = [
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