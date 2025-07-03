import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const EmptySchema = z.object({});

export const oauthTools = [
  {
    name: 'swit-oauth-status',
    description: 'Check OAuth authentication status',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
  {
    name: 'swit-oauth-start',
    description: 'Start OAuth authentication. Returns authentication URL that can be opened in browser.',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
  {
    name: 'swit-oauth-logout',
    description: 'Logout from OAuth authentication and delete stored tokens. Use when re-authentication is required.',
    inputSchema: zodToJsonSchema(EmptySchema),
  },
];