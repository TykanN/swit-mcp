import winston from 'winston';
import * as path from 'path';

// Winston 로거 설정 (MCP 서버용 - stdio 간섭 방지)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
  ),
  transports: [
    // 파일에만 로그 출력 (stdout/stderr 사용 안함)
    new winston.transports.File({
      filename: path.join(process.cwd(), 'swit-mcp-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'swit-mcp.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 개발 환경에서만 콘솔 출력 (MCP 모드가 아닌 경우)
if (process.env.NODE_ENV === 'development' && !process.env.MCP_MODE) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

export { logger };
