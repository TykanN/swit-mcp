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
    description: 'Retrieve list of workspaces',
    inputSchema: zodToJsonSchema(WorkspaceListArgsSchema),
  },
  {
    name: 'swit-channel-list',
    description: 'Retrieve list of channels',
    inputSchema: zodToJsonSchema(ChannelListArgsSchema),
  },
  {
    name: 'swit-message-create',
    description: 'Send message to channel',
    inputSchema: zodToJsonSchema(MessageCreateArgsSchema),
  },
  {
    name: 'swit-message-comment-create',
    description: 'Create comment on message',
    inputSchema: zodToJsonSchema(MessageCommentCreateArgsSchema),
  },
  {
    name: 'swit-message-comment-list',
    description: 'Retrieve list of comments on message',
    inputSchema: zodToJsonSchema(MessageCommentListArgsSchema),
  },
  {
    name: 'swit-project-list',
    description: 'Retrieve list of projects',
    inputSchema: zodToJsonSchema(ProjectListArgsSchema),
  },
];