import { Oauth } from '@swit-api/oauth';
import { logger } from './logger.js';
import { TokenCache } from './token-cache.js';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class OAuthManager {
  private oauth: Oauth;
  private tokenInfo: TokenInfo | null = null;
  private tokenCache: TokenCache;

  constructor(config: OAuthConfig, tokenCache: TokenCache) {
    this.oauth = new Oauth({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      state: '',
      scope: config.scopes.join(' '),
    });
    this.tokenCache = tokenCache;
    this.loadSavedToken();
  }

  /**
   * OAuth 인증 URL 생성
   */
  getAuthorizationUrl(): string {
    return this.oauth.getAuthorizeUrl();
  }

  /**
   * 인증 코드로 토큰 교환
   */
  async exchangeCodeForToken(code: string): Promise<TokenInfo> {
    try {
      const tokenResponse = await this.oauth.getTokenByAuthorizationCode(code);

      this.tokenInfo = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };
      this.saveToken(this.tokenInfo);
      logger.info('OAuth token exchange successful');
      return this.tokenInfo;
    } catch (error) {
      logger.error('OAuth token exchange failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `OAuth token exchange failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 현재 유효한 액세스 토큰 반환
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokenInfo) {
      throw new Error('No OAuth token available. Please authenticate first.');
    }

    // 토큰이 5분 이내에 만료되면 갱신
    if (this.tokenInfo.expiresAt - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }

    return this.tokenInfo.accessToken;
  }

  /**
   * 리프레시 토큰으로 액세스 토큰 갱신
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.tokenInfo?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const tokenResponse = await this.oauth.getTokenByRefreshToken(this.tokenInfo.refreshToken);

      this.tokenInfo = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || this.tokenInfo.refreshToken,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };
      this.saveToken(this.tokenInfo);
      logger.info('OAuth token refresh successful');
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 토큰 정보 설정 (저장된 토큰 복원용)
   */
  setTokenInfo(tokenInfo: TokenInfo): void {
    this.tokenInfo = tokenInfo;
  }

  /**
   * 현재 토큰 정보 반환 (저장용)
   */
  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  /**
   * 토큰 유효성 검사
   */
  isTokenValid(): boolean {
    if (!this.tokenInfo) return false;
    return this.tokenInfo.expiresAt > Date.now();
  }

  /**
   * 로그아웃 (토큰 정보 제거)
   */
  logout(): void {
    this.tokenInfo = null;
    this.tokenCache.clear();
    logger.info('OAuth logout completed');
  }

  /**
   * 저장된 토큰 로드
   */
  private loadSavedToken(): void {
    this.tokenInfo = this.tokenCache.load();
  }

  /**
   * 토큰을 캐시에 저장
   */
  private saveToken(tokenInfo: TokenInfo): void {
    this.tokenCache.save(tokenInfo);
  }
}
