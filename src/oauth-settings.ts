import { OAuthConfig } from './oauth-manager.js';

export interface OAuthScope {
  workspace: boolean;
  channel: boolean;
  message: boolean;
  user: boolean;
}

export class OAuthSettings {
  private static readonly DEFAULT_SCOPES: string[] = [
    'workspace:read',
    'channel:read',
    'message:write',
    'message:read',
    'project:read',
  ];

  constructor(
    public readonly clientId: string,
    public readonly clientSecret: string,
    public readonly port: number = 3000,
    public readonly scopes: string[] = OAuthSettings.DEFAULT_SCOPES
  ) {
    if (!clientId) {
      throw new Error('OAuth client ID is required');
    }
    if (!clientSecret) {
      throw new Error('OAuth client secret is required');
    }
    if (port <= 0 || port > 65535) {
      throw new Error('OAuth port must be between 1 and 65535');
    }
  }

  get redirectUri(): string {
    return `http://localhost:${this.port}/callback`;
  }

  get scopeString(): string {
    return this.scopes.join(' ');
  }

  get config(): OAuthConfig {
    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
      scopes: this.scopes,
    };
  }

  static fromEnvironment(port?: number): OAuthSettings {
    const clientId = process.env.SWIT_CLIENT_ID;
    const clientSecret = process.env.SWIT_CLIENT_SECRET;
    const envPort = process.env.OAUTH_PORT;

    if (!clientId) {
      throw new Error('SWIT_CLIENT_ID environment variable is required');
    }
    if (!clientSecret) {
      throw new Error('SWIT_CLIENT_SECRET environment variable is required');
    }

    const finalPort = port || (envPort ? parseInt(envPort, 10) : 3000);

    return new OAuthSettings(clientId, clientSecret, finalPort);
  }

  withCustomScopes(scopes: string[]): OAuthSettings {
    return new OAuthSettings(this.clientId, this.clientSecret, this.port, scopes);
  }

  withPort(port: number): OAuthSettings {
    return new OAuthSettings(this.clientId, this.clientSecret, port, this.scopes);
  }
}
