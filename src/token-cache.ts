import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenInfo } from './oauth-manager.js';

export class TokenCache {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(os.homedir(), '.swit-mcp-token.json');
  }

  save(tokenInfo: TokenInfo): void {
    const data = JSON.stringify(tokenInfo, null, 2);
    fs.writeFileSync(this.filePath, data, 'utf8');
  }

  load(): TokenInfo | null {
    try {
      if (!this.exists()) {
        return null;
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      const tokenInfo = JSON.parse(data) as TokenInfo;
      return tokenInfo;
    } catch {
      return null;
    }
  }

  clear(): void {
    if (this.exists()) {
      fs.unlinkSync(this.filePath);
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
