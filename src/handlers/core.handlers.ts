import { SwitClient } from '../swit-client.js';
import {
  WorkspaceListArgsSchema,
  ChannelListArgsSchema,
  MessageCreateArgsSchema,
  MessageCommentListArgsSchema,
  MessageCommentCreateArgsSchema,
  ProjectListArgsSchema,
} from '../schemas.js';

export const handleWorkspaceList = async (switClient: SwitClient, args: any) => {
  const validatedArgs = WorkspaceListArgsSchema.parse(args);
  return await switClient.listWorkspaces(validatedArgs);
};

export const handleChannelList = async (switClient: SwitClient, args: any) => {
  const validatedArgs = ChannelListArgsSchema.parse(args);
  return await switClient.listChannels(validatedArgs);
};

export const handleMessageCreate = async (switClient: SwitClient, args: any) => {
  const validatedArgs = MessageCreateArgsSchema.parse(args);
  return await switClient.createMessage(validatedArgs);
};

export const handleMessageCommentCreate = async (switClient: SwitClient, args: any) => {
  const validatedArgs = MessageCommentCreateArgsSchema.parse(args);
  return await switClient.createMessageComment(validatedArgs);
};

export const handleMessageCommentList = async (switClient: SwitClient, args: any) => {
  const validatedArgs = MessageCommentListArgsSchema.parse(args);
  return await switClient.listMessageComments(validatedArgs);
};

export const handleProjectList = async (switClient: SwitClient, args: any) => {
  const validatedArgs = ProjectListArgsSchema.parse(args);
  return await switClient.listProjects(validatedArgs);
};

export const coreHandlers = (switClient: SwitClient) => ({
  'swit-workspace-list': (args: any) => handleWorkspaceList(switClient, args),
  'swit-channel-list': (args: any) => handleChannelList(switClient, args),
  'swit-message-create': (args: any) => handleMessageCreate(switClient, args),
  'swit-message-comment-create': (args: any) => handleMessageCommentCreate(switClient, args),
  'swit-message-comment-list': (args: any) => handleMessageCommentList(switClient, args),
  'swit-project-list': (args: any) => handleProjectList(switClient, args),
});
