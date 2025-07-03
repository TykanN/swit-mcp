import { OAuthWebServer } from '../oauth-web-server.js';

export const handleOAuthStatus = async (oauthWebServer: OAuthWebServer | null) => {
  const isAuthenticated = oauthWebServer?.isAuthenticated() || false;
  const port = process.env.OAUTH_PORT || '3000';

  return {
    authenticated: isAuthenticated,
    status: isAuthenticated ? 'Authenticated' : 'Authentication required',
    webServerUrl: oauthWebServer ? `http://localhost:${port}` : null,
    message: isAuthenticated
      ? 'OAuth authentication completed. Swit API is ready to use.'
      : 'OAuth authentication required. Use swit-oauth-start tool to begin authentication.',
  };
};

export const handleOAuthStart = async (oauthWebServer: OAuthWebServer | null) => {
  if (!oauthWebServer) {
    return {
      error:
        'OAuth web server is not initialized. Please check SWIT_CLIENT_ID and SWIT_CLIENT_SECRET environment variables.',
    };
  }

  if (oauthWebServer.isAuthenticated()) {
    return {
      error: 'OAuth authentication already completed.',
      note: 'To re-authenticate, please logout first.',
    };
  }

  const authUrl = oauthWebServer.getAuthorizationUrl();
  const port = process.env.OAUTH_PORT || '3000';

  return {
    authorizationUrl: authUrl,
    webServerUrl: `http://localhost:${port}`,
    instructions: [
      '1. Open the authorizationUrl above in your browser.',
      '2. Login with your Swit account and authorize the application.',
      '3. The token will be automatically saved upon completion.',
      '4. Use swit-oauth-status to check authentication status.',
    ],
  };
};

export const handleOAuthLogout = async (oauthWebServer: OAuthWebServer | null) => {
  if (!oauthWebServer) {
    return {
      error: 'OAuth web server is not available. Cannot perform logout.',
    };
  }

  oauthWebServer.getOAuthManager().logout();

  return {
    message: 'OAuth logout completed successfully.',
    note: 'Cached tokens have been cleared. Use swit-oauth-start to re-authenticate.',
  };
};

export const oauthHandlers = (oauthWebServer: OAuthWebServer | null) => ({
  'swit-oauth-status': () => handleOAuthStatus(oauthWebServer),
  'swit-oauth-start': () => handleOAuthStart(oauthWebServer),
  'swit-oauth-logout': () => handleOAuthLogout(oauthWebServer),
});
