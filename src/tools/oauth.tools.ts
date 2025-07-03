import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const EmptySchema = z.object({});

export const oauthTools = [
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
];