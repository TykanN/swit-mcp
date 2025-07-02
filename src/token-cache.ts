import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenInfo } from './oauth-manager.js';
import { logger } from './logger.js';

export class TokenCache {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(os.homedir(), '.swit-mcp-token.json');
  }

  save(tokenInfo: TokenInfo): void {
    try {
      const data = JSON.stringify(tokenInfo, null, 2);
      fs.writeFileSync(this.filePath, data, 'utf8');
      logger.debug('Token saved to cache', { filePath: this.filePath });
    } catch (error) {
      logger.error('Failed to save token to cache', { 
        error: error instanceof Error ? error.message : String(error),
        filePath: this.filePath 
      });
      throw new Error(`Failed to save token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  load(): TokenInfo | null {
    try {
      if (!this.exists()) {
        logger.debug('No cached token file found', { filePath: this.filePath });
        return null;
      }

      const data = fs.readFileSync(this.filePath, 'utf8');
      const tokenInfo = JSON.parse(data) as TokenInfo;
      logger.debug('Token loaded from cache', { filePath: this.filePath });
      return tokenInfo;
    } catch (error) {
      logger.error('Failed to load token from cache', { 
        error: error instanceof Error ? error.message : String(error),
        filePath: this.filePath 
      });
      return null;
    }
  }

  clear(): void {
    try {
      if (this.exists()) {
        fs.unlinkSync(this.filePath);
        logger.debug('Token cache cleared', { filePath: this.filePath });
      }
    } catch (error) {
      logger.error('Failed to clear token cache', { 
        error: error instanceof Error ? error.message : String(error),
        filePath: this.filePath 
      });
      throw new Error(`Failed to clear token cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  exists(): boolean {
    try {
      return fs.existsSync(this.filePath);
    } catch {
      return false;
    }
  }

  getFilePath(): string {
    return this.filePath;
  }
}