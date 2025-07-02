import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  offset: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Workspace schemas
export const WorkspaceListArgsSchema = z.object({
  offset: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  name: z.string().optional(),
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  color: z.string(),
  photo: z.string().optional(),
  created: z.string(),
  admin_ids: z.array(z.string()),
  master_id: z.string(),
});

export const WorkspaceListResponseSchema = z.object({
  data: z.object({
    workspaces: z.array(WorkspaceSchema),
    offset: z.string().optional(),
  }),
});

// Channel schemas
export const ChannelListArgsSchema = z.object({
  workspace_id: z.string(),
  offset: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  type: z.string().optional(),
  activity: z.string().optional(),
  disclosure: z.string().optional(),
  name: z.string().optional(),
});

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  created: z.string(),
  is_archived: z.boolean(),
  is_member: z.boolean(),
  is_private: z.boolean(),
  is_starred: z.boolean(),
  is_prev_chat_visible: z.boolean(),
  host_id: z.string(),
});

export const ChannelListResponseSchema = z.object({
  data: z.object({
    channels: z.array(ChannelSchema),
    offset: z.string().optional(),
  }),
});

// Message schemas
export const MessageCreateArgsSchema = z.object({
  channel_id: z.string(),
  content: z.string().optional(),
  body_type: z.enum(['plain', 'markdown']).default('plain').optional(),
  assets: z.array(z.any()).optional(),
  attachments: z.record(z.any()).optional(),
  external_asset_type: z.string().optional(),
});

export const MessageSchema = z.object({
  message_id: z.string(),
  channel_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  content: z.string(),
  created: z.string(),
  comment_count: z.number(),
  assets: z.array(z.any()).optional(),
  attachments: z.record(z.any()).optional(),
});

export const MessageCreateResponseSchema = z.object({
  data: z.object({
    message: MessageSchema,
  }),
});

// Message comment schemas
export const MessageCommentListArgsSchema = z.object({
  message_id: z.string(),
  offset: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const MessageCommentCreateArgsSchema = z.object({
  message_id: z.string(),
  content: z.string(),
  body_type: z.enum(['plain', 'markdown']).default('plain').optional(),
  assets: z.record(z.any()).optional(),
  external_asset_type: z.string().optional(),
});

export const MessageCommentSchema = z.object({
  comment_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  content: z.string(),
  created: z.string(),
  assets: z.array(z.any()).optional(),
});

export const MessageCommentListResponseSchema = z.object({
  data: z.object({
    comments: z.array(MessageCommentSchema),
    offset: z.string().optional(),
  }),
});

export const MessageCommentCreateResponseSchema = z.object({
  data: z.object({
    comment: MessageCommentSchema,
  }),
});

// Project schemas
export const ProjectListArgsSchema = z.object({
  workspace_id: z.string(),
  offset: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
  activity: z.string().optional(),
  disclosure: z.string().optional(),
  name: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  created: z.string(),
  color: z.string(),
  is_archived: z.boolean(),
  is_private: z.boolean(),
  is_starred: z.boolean(),
  host_id: z.string(),
});

export const ProjectListResponseSchema = z.object({
  data: z.object({
    projects: z.array(ProjectSchema),
    offset: z.string().optional(),
  }),
});

// Error schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// Type exports
export type WorkspaceListArgs = z.infer<typeof WorkspaceListArgsSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceListResponse = z.infer<typeof WorkspaceListResponseSchema>;

export type ChannelListArgs = z.infer<typeof ChannelListArgsSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type ChannelListResponse = z.infer<typeof ChannelListResponseSchema>;

export type MessageCreateArgs = z.infer<typeof MessageCreateArgsSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessageCreateResponse = z.infer<typeof MessageCreateResponseSchema>;

export type MessageCommentListArgs = z.infer<typeof MessageCommentListArgsSchema>;
export type MessageCommentCreateArgs = z.infer<typeof MessageCommentCreateArgsSchema>;
export type MessageComment = z.infer<typeof MessageCommentSchema>;
export type MessageCommentListResponse = z.infer<typeof MessageCommentListResponseSchema>;
export type MessageCommentCreateResponse = z.infer<typeof MessageCommentCreateResponseSchema>;

export type ProjectListArgs = z.infer<typeof ProjectListArgsSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
