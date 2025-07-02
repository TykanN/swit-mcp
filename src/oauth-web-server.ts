import express from 'express';
import { Server } from 'http';
import { OAuthManager, TokenInfo } from './oauth-manager.js';
import { OAuthSettings } from './oauth-settings.js';
import { TokenCache } from './token-cache.js';

export class OAuthWebServer {
  private app: express.Application;
  private server: Server | null = null;
  private oauthManager: OAuthManager;
  private settings: OAuthSettings;
  private authPromise: Promise<TokenInfo> | null = null;
  private authResolve: ((token: TokenInfo) => void) | null = null;
  private authReject: ((error: Error) => void) | null = null;

  constructor(settings: OAuthSettings, tokenCache?: TokenCache) {
    this.settings = settings;
    const cache = tokenCache || new TokenCache();
    this.oauthManager = new OAuthManager(settings.config, cache);
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // OAuth 콜백 엔드포인트
    this.app.get('/callback', async (req, res) => {
      try {
        const { code, error, error_description } = req.query;

        if (error) {
          const errorMsg = `OAuth 인증 실패: ${error_description || error}`;
          console.error(errorMsg);

          res.send(this.getErrorPage(errorMsg));

          if (this.authReject) {
            this.authReject(new Error(errorMsg));
            this.authPromise = null;
            this.authResolve = null;
            this.authReject = null;
          }
          return;
        }

        if (!code || typeof code !== 'string') {
          const errorMsg = 'OAuth 콜백에서 인증 코드를 받지 못했습니다.';
          console.error(errorMsg);

          res.send(this.getErrorPage(errorMsg));

          if (this.authReject) {
            this.authReject(new Error(errorMsg));
            this.authPromise = null;
            this.authResolve = null;
            this.authReject = null;
          }
          return;
        }

        console.error('OAuth authorization code received, exchanging for token');
        const tokenInfo = await this.oauthManager.exchangeCodeForToken(code);

        console.error('OAuth authentication successful');
        res.send(this.getSuccessPage());

        if (this.authResolve) {
          this.authResolve(tokenInfo);
          this.authPromise = null;
          this.authResolve = null;
          this.authReject = null;
        }
      } catch (error) {
        const errorMsg = `토큰 교환 실패: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);

        res.send(this.getErrorPage(errorMsg));

        if (this.authReject) {
          this.authReject(new Error(errorMsg));
          this.authPromise = null;
          this.authResolve = null;
          this.authReject = null;
        }
      }
    });

    // 인증 상태 확인 엔드포인트
    this.app.get('/status', (req, res) => {
      const isAuthenticated = this.oauthManager.isTokenValid();
      res.json({
        authenticated: isAuthenticated,
        message: isAuthenticated ? 'Authenticated' : 'Authentication required',
        port: this.settings.port,
        redirectUri: this.settings.redirectUri,
        scopes: this.settings.scopes,
      });
    });

    // 루트 페이지
    this.app.get('/', (req, res) => {
      res.send(this.getHomePage());
    });
  }

  /**
   * 웹서버 시작
   */
  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.settings.port, () => {
          console.error(`OAuth web server started on port ${this.settings.port} at http://localhost:${this.settings.port}`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            const errorMsg = `Port ${this.settings.port} is already in use. Please use a different port.`;
            console.error(`OAuth web server port conflict on port ${this.settings.port}:`, errorMsg);
            reject(new Error(errorMsg));
          } else {
            console.error('OAuth web server error:', error.message || String(error));
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 웹서버 중지
   */
  async stopServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error('OAuth web server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * OAuth 인증 URL 생성
   */
  getAuthorizationUrl(): string {
    return this.oauthManager.getAuthorizationUrl();
  }

  /**
   * OAuth 인증 대기 (Promise 기반)
   */
  async waitForAuthentication(): Promise<TokenInfo> {
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = new Promise((resolve, reject) => {
      this.authResolve = resolve;
      this.authReject = reject;
    });

    return this.authPromise;
  }

  /**
   * OAuth 매니저 반환
   */
  getOAuthManager() {
    return this.oauthManager;
  }

  /**
   * 인증 상태 확인
   */
  isAuthenticated(): boolean {
    return this.oauthManager.isTokenValid();
  }

  /**
   * 홈 페이지 HTML
   */
  private getHomePage(): string {
    const authUrl = this.getAuthorizationUrl();
    const isAuth = this.isAuthenticated();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Swit MCP OAuth</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .btn { padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .btn:hover { background-color: #0056b3; }
        .info { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🔗 Swit MCP OAuth Authentication</h1>
    
    ${
      isAuth
        ? '<div class="status success">✅ Already authenticated!</div>'
        : `<div class="status warning">⚠️ OAuth authentication required.</div>
       <a href="${authUrl}" class="btn">Login with Swit Account</a>`
    }
    
    <h3>📊 Authentication Status</h3>
    <a href="/status" class="btn">Check Status (JSON)</a>
    
    <div class="info">
        <strong>Server Configuration:</strong><br>
        Port: ${this.settings.port}<br>
        Redirect URI: ${this.settings.redirectUri}<br>
        Scopes: ${this.settings.scopeString}
    </div>
    
    <h3>ℹ️ How to Use</h3>
    <p>1. Click the "Login with Swit Account" button above.</p>
    <p>2. Authorize the application in Swit and you'll be redirected back automatically.</p>
    <p>3. Once authenticated, the MCP server can access Swit APIs.</p>
</body>
</html>`;
  }

  /**
   * 성공 페이지 HTML
   */
  private getSuccessPage(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful - Swit MCP</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { padding: 20px; background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 5px; margin: 20px 0; }
        .btn { padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🎉 Authentication Successful!</h1>
    <div class="success">
        <h3>✅ OAuth authentication completed!</h3>
        <p>The MCP server can now access Swit APIs.</p>
        <p>You can close this window.</p>
    </div>
    <a href="/" class="btn">Return to Home</a>
    <script>
        // Automatically redirect to home after 5 seconds
        setTimeout(() => {
            window.location.href = '/';
        }, 5000);
    </script>
</body>
</html>`;
  }

  /**
   * 에러 페이지 HTML
   */
  private getErrorPage(error: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed - Swit MCP</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px 0; }
        .btn { padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>❌ Authentication Failed</h1>
    <div class="error">
        <h3>OAuth authentication failed</h3>
        <p><strong>Error:</strong> ${error}</p>
        <p>Please try again.</p>
    </div>
    <a href="/" class="btn">Try Again</a>
</body>
</html>`;
  }
}
