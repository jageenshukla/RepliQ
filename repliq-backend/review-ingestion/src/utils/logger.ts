import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import dotenv from 'dotenv';
dotenv.config();

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, tags, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      tags,
      message,
      ...meta
    });
  })
);

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
      level: LOG_LEVEL,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log methods with tags
function logWithLevel(level: string, message: string, tags?: string[], meta: Record<string, any> = {}) {
  logger.log(level, message, { tags, ...meta });
}

export const logObj = {
  error: (message: string, tags?: string[], meta: Record<string, any> = {}) => logWithLevel('error', message, tags, meta),
  warn: (message: string, tags?: string[], meta: Record<string, any> = {}) => logWithLevel('warn', message, tags, meta),
  info: (message: string, tags?: string[], meta: Record<string, any> = {}) => logWithLevel('info', message, tags, meta),
  debug: (message: string, tags?: string[], meta: Record<string, any> = {}) => logWithLevel('debug', message, tags, meta),
  fatal: (message: string, tags?: string[], meta: Record<string, any> = {}) => logWithLevel('fatal', message, tags, meta),
};

// Create a tagged logger object
export function createLoggerWithTags(baseTags: string[]) {
  return {
    error: (message: string, tags?: string[], meta: Record<string, any> = {}) => logObj.error(message, [...baseTags, ...(tags || [])], meta),
    warn: (message: string, tags?: string[], meta: Record<string, any> = {}) => logObj.warn(message, [...baseTags, ...(tags || [])], meta),
    info: (message: string, tags?: string[], meta: Record<string, any> = {}) => logObj.info(message, [...baseTags, ...(tags || [])], meta),
    debug: (message: string, tags?: string[], meta: Record<string, any> = {}) => logObj.debug(message, [...baseTags, ...(tags || [])], meta),
    fatal: (message: string, tags?: string[], meta: Record<string, any> = {}) => logObj.fatal(message, [...baseTags, ...(tags || [])], meta),
  };
}
