import { OAuthManager, TokenInfo } from './oauth-manager.js';
import { OAuthSettings } from './oauth-settings.js';
import { TokenCache } from './token-cache.js';
import { logger } from './logger.js';

export class AuthHelper {
  private oauthManager: OAuthManager;

  constructor(settings: OAuthSettings, tokenCache: TokenCache) {
    this.oauthManager = new OAuthManager(settings.config, tokenCache);
  }


  /**
   * OAuth 인증 URL 생성
   */
  getAuthorizationUrl(): string {
    const authUrl = this.oauthManager.getAuthorizationUrl();
    logger.debug('OAuth authorization URL generated');
    return authUrl;
  }

  /**
   * 인증 코드로 토큰 교환 및 저장
   */
  async authenticateWithCode(code: string): Promise<TokenInfo> {
    try {
      const tokenInfo = await this.oauthManager.exchangeCodeForToken(code);
      logger.info('OAuth authentication completed successfully');
      return tokenInfo;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('OAuth authentication failed', { error: errorMsg });
      throw error;
    }
  }

  /**
   * 현재 인증 상태 확인
   */
  isAuthenticated(): boolean {
    return this.oauthManager.isTokenValid();
  }

  /**
   * OAuth 매니저 반환
   */
  getOAuthManager(): OAuthManager {
    return this.oauthManager;
  }

  /**
   * 저장된 토큰 정보 삭제
   */
  logout(): void {
    this.oauthManager.logout();
    logger.info('OAuth logout completed successfully');
  }
}
